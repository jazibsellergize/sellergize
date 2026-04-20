let crawlerConnectionPort = null;
let contentScriptPorts = new Map();

const tabStates = new Map();
const pendingTasks = new Map();
pendingTasks.set("default", []);

// Only tabs in this set will run crawler tasks
const crawlerTabs = new Set();

// The URL to match for identifying the crawler tab (set when loading with random URL)
let pendingCrawlerConfigs = []; // Array of { url, sessionId, tasks }


/**
 * Parses a date string into Unix epoch seconds.
 * Supports various formats like "Oct 03, 2025" or "8 August 2025".
 * Adjusts year if missing or out of range and ensures the date is not in the future.
 * @param {string} dateString - The raw date string to parse.
 * @returns {string} Seconds since epoch as a string, or "0" on failure.
 * @see executeNextTask -> return task handling uses this to convert orderDate.
 */
function parseDateToSeconds(dateString) {
    console.log("[DateParser] Input:", dateString);

    if (!dateString || typeof dateString !== "string") {
        return "0";
    }

    try {
        const parsed = new Date(dateString);
        console.log("[DateParser] Parsed Date object:", parsed);

        if (isNaN(parsed.getTime())) {
            return "0";
        }

        const day = parsed.getDate();
        const month = parsed.getMonth();
        let year = parsed.getFullYear();

        console.log("[DateParser] Extracted values →", { day, month, year });

        if (
            isNaN(day) || isNaN(month) || isNaN(year) ||
            day < 1 || day > 31 ||
            month < 0 || month > 11
        ) return "0";

        const now = new Date();
        const currentYear = now.getFullYear();

        console.log("[DateParser] Now:", now);
        console.log("[DateParser] Current Year:", currentYear);

        if (year <= 2001) {
            year = currentYear;
        }

        let resultDate = new Date(year, month, day);
        console.log("[DateParser] Reconstructed Date:", resultDate);

        if (
            resultDate.getDate() !== day ||
            resultDate.getMonth() !== month
        ) return "0";


        if (resultDate > now) {
            resultDate.setFullYear(resultDate.getFullYear() - 1);
            console.log("[DateParser] Adjusted Date:", resultDate);
        }

        const seconds = Math.floor(resultDate.getTime() / 1000);
        return String(seconds);
    } catch (err) {
        return "0";
    }
}


/**
 * Retrieves or creates the state object for a given tab.
 * The state tracks task stack, active task, variables, and page‑load flags.
 * @param {number} tabId - Identifier of the browser tab.
 * @returns {object} The state map entry for the tab.
 * @see startCrawler, executeNextTask, handleTaskResult – all rely on this state.
 */
function getTabState(tabId) {
    if (!tabStates.has(tabId)) {
        tabStates.set(tabId, {
            taskStack: [],
            activeTask: null,
            variables: {},
            hasStarted: false,
            waitingForPageLoad: false,
            pageLoadTimeoutId: null,  // Timeout ID for click wait fallback
            sessionId: null // Added sessionId
        });
    }
    return tabStates.get(tabId);
}


/**
 * Cleans up all stored data for a tab when it is closed or stopped.
 * Removes state, ports, and pending tasks to avoid memory leaks.
 * @param {number} tabId - Identifier of the tab to clear.
 * @see browser.tabs.onRemoved listener and STOP_CRAWL handling.
 */
function clearTabState(tabId) {
    tabStates.delete(tabId);
    contentScriptPorts.delete(tabId);
    crawlerTabs.delete(tabId);
    pendingTasks.delete(tabId);
    console.log(`[Crawler] Cleared state for tab ${tabId}`);
}

/**
 * Initializes crawling for a specific tab with a list of tasks.
 * Populates the task stack, resets variables, and begins execution.
 * @param {number} tabId - Target tab identifier.
 * @param {Array} tasks - Array of task objects; if omitted defaults are used.
 * @see handleNativeMessage (START_CRAWL) and tab update listener trigger this.
 */
function startCrawler(tabId, tasks) {
    const selectedTasks = tasks && tasks.length
        ? tasks
        : (pendingTasks.get(tabId) || pendingTasks.get("default") || []);

    console.log(`[Crawler] Starting crawler for tab ${tabId} with ${selectedTasks.length} tasks`);

    const state = getTabState(tabId);
    state.taskStack = [...selectedTasks].reverse();
    state.activeTask = null;
    state.variables = {};
    state.hasStarted = true;
    state.waitingForPageLoad = false;

    executeNextTask(tabId);
}

/**
 * Pops the next task from the stack and dispatches it to the content script.
 * Handles special commands (while, if, increment, etc.) internally.
 * @param {number} tabId - Identifier of the tab whose task queue is processed.
 * @see startCrawler, handleTaskResult – orchestrates the task flow.
 */
function executeNextTask(tabId) {
    const state = getTabState(tabId);

    if (state.waitingForPageLoad) {
        return;
    }

    if (state.taskStack.length === 0) {
        console.log(`[Crawler] Tab ${tabId}: All tasks completed`);
        console.log(`[Crawler] Tab ${tabId}: Final variables:`, state.variables);
        sendNativeEvent({
            type: "ALL_TASKS_COMPLETE",
            tabId,
            sessionId: state.sessionId, // Include sessionId
            variables: state.variables
        });
        return;
    }

    const task = state.taskStack[state.taskStack.length - 1];

    /**
     * Handles a 'while' loop command.
     * Evaluates the loop condition; if true, re-pushes the while task and its loopActions onto the stack.
     * Edge cases: if condition is false, the loop exits;
     */
    if (task.command === 'while') {
        state.taskStack.pop();
        const conditionMet = checkCondition(task.condition, state.variables);
        console.log(`[Crawler] Tab ${tabId}: Checking WHILE condition:`, task.condition, 'Result:', conditionMet);

        if (conditionMet) {
            state.taskStack.push(task);
            if (task.loopActions && task.loopActions.length > 0) {
                const actions = [...task.loopActions].reverse();
                state.taskStack.push(...actions);
            }
        }
        logTaskCompletion(tabId, task.id, task.command, state.variables);
        state.activeTask = null;
        setTimeout(() => executeNextTask(tabId), 0);
        return;
    }

    /**
     * Handles an 'if' conditional command.
     * Evaluates the condition and pushes either the ifActions or elseActions onto the stack.
     */
    if (task.command === 'if') {
        state.taskStack.pop();
        const conditionMet = checkCondition(task.condition, state.variables);
        console.log(`[Crawler] Tab ${tabId}: Checking IF condition:`, task.condition, 'Result:', conditionMet);

        if (conditionMet) {
            if (task.ifActions && task.ifActions.length > 0) {
                const actions = [...task.ifActions].reverse();
                state.taskStack.push(...actions);
            }
        } else {
            if (task.elseActions && task.elseActions.length > 0) {
                const actions = [...task.elseActions].reverse();
                state.taskStack.push(...actions);
            }
        }

        logTaskCompletion(tabId, task.id, task.command, state.variables);
        state.activeTask = null;
        setTimeout(() => executeNextTask(tabId), 0);
        return;
    }

    /**
     * Handles an 'increment' command.
     * Increments a numeric variable (default 1) and stores the result if a result key is provided.
     * Edge cases: non-numeric values are treated as 0;
     */
    if (task.command === 'increment') {
        state.taskStack.pop();

        let valueToIncrement = interpolate(task.selector, state.variables);
        let incrementBy = 1;
        if (task.incrementBy) {
            incrementBy = parseInt(interpolate(task.incrementBy, state.variables)) || 1;
        }
        let newValue = (parseInt(valueToIncrement) || 0) + incrementBy;

        if (task.result) {
            state.variables[task.result] = newValue;
            console.log(`[Crawler] Tab ${tabId}: Incremented ${task.result} to ${newValue}`);
        }

        logTaskCompletion(tabId, task.id, task.command, state.variables);
        state.activeTask = null;
        setTimeout(() => executeNextTask(tabId), 0);
        return;
    }

    /**
     * Handles a 'storeValue' command.
     * Evaluates an expression and stores the result in a variable.
     */
    if (task.command === 'storeValue') {
        state.taskStack.pop();
        const value = interpolate(task.value, state.variables);
        if (task.result) {
            state.variables[task.result] = value;
            console.log(`[Crawler] Tab ${tabId}: Stored ${task.result} = ${value}`);
        }

        logTaskCompletion(tabId, task.id, task.command, state.variables);
        state.activeTask = null;
        setTimeout(() => executeNextTask(tabId), 0);
        return;
    }

    /**
     * Handles an 'initiateArray' command.
     * Creates an empty array and assigns it to the specified result variable.
     */
    if (task.command === 'initiateArray') {
        state.taskStack.pop();
        if (task.result) {
            state.variables[task.result] = [];
            console.log(`[Crawler] Tab ${tabId}: Initiated array ${task.result}`);
        }
        logTaskCompletion(tabId, task.id, task.command, state.variables);
        state.activeTask = null;
        setTimeout(() => executeNextTask(tabId), 0);
        return;
    }

    /**
     * Handles an 'initiateObject' command.
     * Creates an empty object and assigns it to the specified result variable.
     */
    if (task.command === 'initiateObject') {
        state.taskStack.pop();
        if (task.result) {
            state.variables[task.result] = {};
            console.log(`[Crawler] Tab ${tabId}: Initiated object ${task.result}`);
        }
        logTaskCompletion(tabId, task.id, task.command, state.variables);
        state.activeTask = null;
        setTimeout(() => executeNextTask(tabId), 0);
        return;
    }

    /**
     * Handles a 'pushToArray' command.
     * Pushes a value onto a target array variable.
     */
    if (task.command === 'pushToArray') {
        state.taskStack.pop();
        const valueToPush = interpolate(task.value, state.variables);
        if (task.array && state.variables[task.array] && Array.isArray(state.variables[task.array])) {
            state.variables[task.array].push(valueToPush);

            console.log(`[Crawler] Tab ${tabId}: Pushed item to ${task.array}. New length: ${state.variables[task.array].length}`);
        } else {
            console.error(`[Crawler] Tab ${tabId}: Cannot push to ${task.array}. Not an array or undefined.`);
        }
        logTaskCompletion(tabId, task.id, task.command, state.variables);
        state.activeTask = null;
        setTimeout(() => executeNextTask(tabId), 0);
        return;
    }

    /**
     * Handles a 'storeArrayLength' command.
     * Stores the length of a specified array into a result variable.
     * Edge cases: if the source is not an array, length is stored as 0.
     */
    if (task.command === 'storeArrayLength') {
        state.taskStack.pop();

        const array = interpolate(task.array, state.variables);
        const length = Array.isArray(array) ? array.length : 0;

        if (task.result) {
            state.variables[task.result] = length;
            console.log(`[Crawler] Tab ${tabId}: Stored array length ${task.result} = ${length}`);
        }
        logTaskCompletion(tabId, task.id, task.command, state.variables);
        state.activeTask = null;
        setTimeout(() => executeNextTask(tabId), 0);
        return;
    }

    /**
     * Handles a 'storeArrayIndexValue' command.
     * Retrieves a value from an array at a given index and stores it.
     */
    if (task.command === 'storeArrayIndexValue') {
        state.taskStack.pop();
        const array = interpolate(task.array, state.variables);
        const indexStr = interpolate(task.index, state.variables);
        const index = parseInt(indexStr);

        if (Array.isArray(array) && !isNaN(index)) {
            const value = array[index];
            if (task.result) {
                state.variables[task.result] = value;
                console.log(`[Crawler] Tab ${tabId}: Stored array index value ${task.result} = ...`);
            }
        } else {
            console.error(`[Crawler] Tab ${tabId}: Failed to storeArrayIndexValue. Array: ${Array.isArray(array)}, Index: ${index}`);
        }

        logTaskCompletion(tabId, task.id, task.command, state.variables);
        state.activeTask = null;
        setTimeout(() => executeNextTask(tabId), 0);
        return;
    }

    /**
     * Handles a 'deleteVariables' command.
     * Deletes one or more variables from the current state.
     */
    if (task.command === 'deleteVariables') {
        state.taskStack.pop();

        let variablesToDelete = [];
        if (typeof task.names === 'string') {
            variablesToDelete = task.names.split(',').map(n => n.trim()).filter(Boolean);
        } else if (Array.isArray(task.names)) {
            variablesToDelete = task.names;
        }

        if (variablesToDelete.length > 0) {
            variablesToDelete.forEach(name => {
                delete state.variables[name];
            });
            console.log(`[Crawler] Tab ${tabId}: Deleted variables:`, variablesToDelete);
        } else {
            console.warn(`[Crawler] Tab ${tabId}: deleteVariables task missing 'names' (comma-separated string)`);
        }

        logTaskCompletion(tabId, task.id, task.command, state.variables);
        state.activeTask = null;
        setTimeout(() => executeNextTask(tabId), 0);
        return;
    }

    /**
     * Handles a 'return' command.
     * Finalizes the task flow, optionally transforming orderDate fields and sending data back to the native host.
     * Edge cases: if dataArray is missing or not an array, no transformation occurs; variables are cleared after sending.
     */
    if (task.command === 'return') {
        state.taskStack.pop();
        if (state.variables.dataArray && Array.isArray(state.variables.dataArray)) {
            state.variables.dataArray = state.variables.dataArray.map((item, index) => {
                if (item && item.orderDate) {
                    console.log(`[NEW Crawler] Tab ${tabId}: orderDate:`, item.orderDate);
                    const seconds = parseDateToSeconds(item.orderDate);
                    console.log(`[NEW Crawler] Tab ${tabId}: orderDate in seconds:`, seconds);
                    return { ...item, orderDate: seconds };
                }
                console.log(`[NEW Crawler] Tab ${tabId}: Returing the same orderDate:`, item.orderDate);

                return item;
            });
        }

        sendNativeEvent({
            type: "RETURN_DATA",
            tabId,
            sessionId: state.sessionId, // Include sessionId
            variables: state.variables
        });

        // Clear all variables as requested
        state.variables = {};

        logTaskCompletion(tabId, task.id, task.command, state.variables);
        state.activeTask = null;
        setTimeout(() => executeNextTask(tabId), 0);
        return;
    }



    const port = contentScriptPorts.get(tabId);
    if (!port) {
        console.log(`[Crawler] Tab ${tabId}: Content script not connected. Waiting for connection...`);
        // Defensive timeout: if content script never reconnects, send SCRIPT_FAILED with variables
        setTimeout(() => {
            const retryPort = contentScriptPorts.get(tabId);
            if (!retryPort && state.hasStarted && !state.activeTask) {
                console.error(`[Crawler] Tab ${tabId}: Content script still not connected after timeout. Sending SCRIPT_FAILED.`);
                sendNativeEvent({
                    type: "SCRIPT_FAILED",
                    tabId,
                    sessionId: state.sessionId,
                    variables: state.variables,
                    error: "Content script connection timeout"
                });
            }
        }, 15000);
        return;
    }

    state.taskStack.pop();
    state.activeTask = task;
    console.log(`[Crawler] Tab ${tabId}: Executing task ${task.id}: ${task.command}`);

    /**
     * If the task is an 'open' command or a 'click' command with wait=true (by default we assume it to be true),
     * set the waitingForPageLoad flag to true.
     * This indicates that the browser should wait for a PAGE_READY event
     * before executing the next task.
     */
    if (task.command === 'open' || (task.command === 'click' && task.wait !== false)) {
        state.waitingForPageLoad = true;
    }

    /**
     * Forward the task to the content script for execution.
     * Any task that is not processed directly in the background
     * will be sent to the content script via this message.
     * The content script handles the task and reports back the result.
     */
    port.postMessage({
        type: 'EXECUTE_TASK',
        task: task,
        variables: state.variables
    });
}

/**
 * Processes the result of a task reported by the content script.
 * Stores returned values, notifies the native host, and advances the queue.
 * @param {number} tabId - Tab where the task ran.
 * @param {string} taskId - Identifier of the completed task.
 * @param {boolean} success - Whether the task succeeded.
 * @param {*} result - Value returned by the task (if any).
 * @param {string} [error] - Error message if the task failed.
 * @see extensionCommunicationPort message handling in content.js.
 */
function handleTaskResult(tabId, taskId, success, result, error) {
    const state = getTabState(tabId);
    const task = state.activeTask;


    if (!task) {
        console.error(`[Crawler] Tab ${tabId}: Task mismatch or no active task. Expected ${taskId}, found ${task ? task.id : 'none'}`);
        return;
    }


    if (success) {
        if (task.result) {
            state.variables[task.result] = result;
            console.log(`[Crawler] Tab ${tabId}: Task ${taskId} completed, stored: ${task.result} =`, result);
        } else {
            console.log(`[Crawler] Tab ${tabId}: Task ${taskId} completed (no value to store)`);
        }
        sendNativeEvent({
            type: "TASK_COMPLETE",
            tabId,
            taskId,
            sessionId: state.sessionId, // Include sessionId
            success,
            result
        });
        logTaskCompletion(tabId, taskId, task.command, state.variables);

        // For click with wait=true, set up a timeout fallback
        // If PAGE_READY doesn't arrive within 15 seconds, assume no navigation and continue
        if (task.command === 'click' && task.wait !== false && state.waitingForPageLoad) {
            console.log(`[Crawler] Tab ${tabId}: Click with wait=true completed, waiting for PAGE_READY (5s timeout)`);
            state.activeTask = null;
            state.pageLoadTimeoutId = setTimeout(() => {
                if (state.waitingForPageLoad) {
                    console.log(`[Crawler] Tab ${tabId}: PAGE_READY timeout - no navigation detected, continuing...`);
                    state.waitingForPageLoad = false;
                    state.pageLoadTimeoutId = null;
                    executeNextTask(tabId);
                }
            }, 15000);
            return;
        }
    } else {
        console.error(`[Crawler] Tab ${tabId}: Task ${taskId} failed:`, error);
        // Reset waitingForPageLoad on failure to prevent getting stuck
        state.waitingForPageLoad = false;
        sendNativeEvent({
            type: "TASK_FAILED",
            tabId,
            taskId,
            sessionId: state.sessionId,
            error
        });
    }

    state.activeTask = null;
    executeNextTask(tabId);
}

/**
 * Tab Update Listener
 *
 * After tasks are set, this listener monitors tab updates.
 * It waits for a tab to finish loading (`status === "complete"`).
 * When the tab's URL matches a pending crawler configuration, the
 * corresponding tasks are assigned to that specific tab.
 * This ensures tasks run only on the intended tab and not arbitrarily
 * on any open tab.
 */
browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (tab.status === "complete") {
        console.log("[Crawler] Tab Updated:", { tabId, url: tab.url });

        const state = getTabState(tabId);
        if (!state.hasStarted) {
            // Check against pending configs
            const matchIndex = pendingCrawlerConfigs.findIndex(config =>
                tab.url && tab.url.startsWith(config.url)
            );

            if (matchIndex !== -1) {
                const config = pendingCrawlerConfigs[matchIndex];
                pendingCrawlerConfigs.splice(matchIndex, 1); // Remove from pending

                console.log(`[Crawler] Matched pending crawler URL: ${config.url}`);
                crawlerTabs.add(tabId);

                state.sessionId = config.sessionId; // Store sessionId
                startCrawler(tabId, config.tasks);
            } else if (crawlerTabs.has(tabId) || pendingTasks.has(tabId)) {
                startCrawler(tabId);
            }
        }
    }
});

// Clean up when tab is closed
browser.tabs.onRemoved.addListener((tabId) => {
    clearTabState(tabId);
});

// Content Script Port Connection
browser.runtime.onConnect.addListener((port) => {

    const tabId = port.sender?.tab?.id;

    if (!tabId) {
        console.error("[Crawler] Could not get tabId from port sender");
        return;
    }

    contentScriptPorts.set(tabId, port);
    console.log(`[Crawler] Content script connected for tab ${tabId}:`, port.name);
    sendNativeEvent({ type: "CONTENT_CONNECTED", tabId });

    const state = getTabState(tabId);

    // Recovery: if there was an active task when content script reconnected, re-execute it
    // Recovery: if there was an active task when content script reconnected, re-execute it
    if (state.hasStarted && state.activeTask) {
        if (state.waitingForPageLoad) {
            console.log(`[Crawler] Tab ${tabId}: Skipping re-execution of task ${state.activeTask.id} because we are waiting for page load.`);
        } else {
            console.log(`[Crawler] Tab ${tabId}: Re-executing interrupted task ${state.activeTask.id} after reconnection...`);
            const task = state.activeTask;
            port.postMessage({
                type: 'EXECUTE_TASK',
                task: task,
                variables: state.variables
            });
        }
    } else if (state.hasStarted && !state.activeTask) {
        console.log(`[Crawler] Tab ${tabId}: Resuming execution after connection...`);
        executeNextTask(tabId);
    }

    port.onMessage.addListener((msg) => {
        console.log(`[Crawler] Tab ${tabId}: Received from content script:`, msg);

        if (msg.type === 'TASK_COMPLETE') {
            handleTaskResult(tabId, msg.taskId, msg.success, msg.result, msg.error);
        }

        if (msg.type === 'PAGE_READY') {
            sendNativeEvent({ type: "PAGE_READY", tabId });
            if (state.waitingForPageLoad) {
                // Clear the timeout if PAGE_READY arrives before it fires
                if (state.pageLoadTimeoutId) {
                    clearTimeout(state.pageLoadTimeoutId);
                    state.pageLoadTimeoutId = null;
                    console.log(`[Crawler] Tab ${tabId}: PAGE_READY received, cleared timeout`);
                }
                state.waitingForPageLoad = false;
                state.activeTask = null;
                executeNextTask(tabId);
            }
            // Note: Don't re-execute activeTask here - reconnect handler already does that
        }
    });

    port.onDisconnect.addListener(() => {
        console.log(`[Crawler] Content script disconnected for tab ${tabId}`);
        contentScriptPorts.delete(tabId);
        sendNativeEvent({ type: "CONTENT_DISCONNECTED", tabId });
    });
});

/**
 * Establishes a persistent native‑messaging connection to the host.
 * Sends an EXT_READY event once connected and wires up message listeners.
 * @see background script initialization at the bottom of the file.
 */
function connectNative() {
    if (crawlerConnectionPort) return;
    crawlerConnectionPort = browser.runtime.connectNative("crawlerChannel");
    console.log("[Crawler] Native connection opened");
    sendNativeEvent({ type: "EXT_READY" });

    crawlerConnectionPort.onMessage.addListener((message) => {
        console.log("[Crawler] Received from native host:", message);
        handleNativeMessage(message);
    });

    crawlerConnectionPort.onDisconnect.addListener(() => {
        console.warn("[Crawler] Native connection disconnected");
        crawlerConnectionPort = null;
    });
}

/**
 * Sends a JSON payload to the native host via the established port.
 * @param {object} payload - Message object to forward to the native side.
 * @see all places where background needs to inform the host (e.g., TASK_COMPLETE).
 */
function sendNativeEvent(payload) {
    if (!crawlerConnectionPort) {
        console.warn("[Crawler] Native port not connected, skipping send", payload);
        return;
    }
    try {
        crawlerConnectionPort.postMessage(payload);
    } catch (e) {
        console.error("[Crawler] Failed to post native message", e);
    }
}

/**
 * Dispatches incoming native messages to appropriate handlers.
 * Supports SET_TASKS, START_CRAWL, and STOP_CRAWL commands.
 * @param {object} message - Parsed message from the native host.
 * @see connectNative's onMessage listener.
 */
function handleNativeMessage(message) {
    const { type } = message || {};
    if (!type) return;

    if (type === "SET_TASKS") {
        const { tabId = "default", tasks = [], crawlerUrl = null, sessionId = null } = message;

        if (crawlerUrl) {
            // Store specific config for this URL/session
            pendingCrawlerConfigs.push({
                url: crawlerUrl,
                sessionId: sessionId,
                tasks: tasks
            });
            console.log(`[Crawler] Waiting for tab with URL: ${crawlerUrl} (Session: ${sessionId})`);
        } else {
            // fallback for legacy/default
            pendingTasks.set(tabId, tasks);
            if (tabId !== "default") {
                crawlerTabs.add(tabId);
                const state = getTabState(tabId);
                state.sessionId = sessionId;
            }
        }

        sendNativeEvent({ type: "TASKS_UPDATED", tabId, count: tasks.length, sessionId });
        return;
    }

    // No longer in use - Can be use to start crawl
    if (type === "START_CRAWL") {
        const { tabId, tasks } = message;
        if (tabId !== undefined && tabId !== null) {
            crawlerTabs.add(tabId);
            startCrawler(tabId, tasks);
        } else {
            console.warn("[Crawler] START_CRAWL missing tabId; will start when tab updates");
            pendingTasks.set("default", tasks || pendingTasks.get("default") || []);
        }
        return;
    }

    // No longer in use - Can be use to stop crawl
    if (type === "STOP_CRAWL") {
        const { tabId } = message;
        if (tabId !== undefined && tabId !== null) {
            clearTabState(tabId);
        }
        return;
    }
}

// Entry point - Initialize native connection on load
connectNative();

/**
 * Logs a deep copy of the current variables after a task finishes.
 * Helps debugging by preventing lazy evaluation in the console.
 * @param {number} tabId - Tab identifier.
 * @param {string} taskId - Completed task ID.
 * @param {string} command - Command name of the task.
 * @param {object} variables - Current variable map.
 */
function logTaskCompletion(tabId, taskId, command, variables) {
    // strict copy to avoid lazy evaluation in console
    const variablesCopy = JSON.parse(JSON.stringify(variables));
    console.log(`[Crawler] Tab ${tabId}: Task ${taskId} (${command}) completed. Variables:`, variablesCopy);
}

