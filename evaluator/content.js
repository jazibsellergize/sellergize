let extensionCommunicationPort = browser.runtime.connect({ name: "extensionCommunicationPort" });

if (document.readyState === 'complete') {
    extensionCommunicationPort.postMessage({
        type: 'PAGE_READY'
    });
}

// Node handlers
const nodeHandlers = {
    callFunction: (task, variables) => {
        const functionName = task.action;
        let params = {};
        if (task.parameters) {
            params = interpolate(task.parameters, variables);
        }
        switch (functionName) {
            case 'getAsinObj':
                return getAsinObj(params);
            case 'extractSubstring':
                return extractSubstring(params);
            case 'getSchemaProduct':
                return getSchemaProduct();
            case 'getImage':
                return getImage(params.schema);
            case 'getTitle':
                return getTitle(params.schema);
            case 'getPrice':
                return getPrice(params.schema);
            case 'resolveURL':
                return resolveURL(params);
            default:
                throw new Error(`Unknown function: ${functionName}`);
        }
    },

    /**
     * Store data
     */
    store: (task, variables) => {
        logToBackground("[store] START", task);
        const { type } = task;

        // 1. Resolve Context Element
        const contextElement = task.element
            ? resolveContextElement(task.element, variables)
            : document;

        if (!contextElement) {
            logToBackground("[store] contextElement NOT FOUND");
            return "";
        }

        // 2. Resolve Selector
        const selector = task.selector ? interpolate(task.selector, variables) : null;
        if (!selector) return "";

        // 3. Query candidates once
        let candidates = Array.from(contextElement.querySelectorAll(selector));

        // Handle 'all' elements (Early exit)
        if (task.index === "all") {
            logToBackground("[store][all] found:", candidates.length);
            return candidates.map((_, i) => ({ selector, index: i }));
        }

        // 4. Filter by searchTxt if provided
        if (task.searchTxt) {
            const txt = interpolate(task.searchTxt, variables);

            // Filter by text content
            candidates = candidates.filter(el =>
                el.textContent?.toLowerCase().includes(txt.toLowerCase())
            );

            logToBackground("[store] Getting candidates:", candidates);

            // Keep only deepest elements (filter out parents whose children also matched)
            candidates = candidates.filter(el =>
                !candidates.some(other => other !== el && el.contains(other))
            );

            logToBackground("[store] Getting  deppest candidates:", candidates);

            logToBackground("[store] filter by searchTxt:", txt, "count:", candidates.length);
        }

        // 5. Get target element by index
        const index = task.index !== undefined
            ? parseInt(interpolate(task.index, variables), 10)
            : 0;
        const target = candidates[index];

        logToBackground(`[store] target found: ${!!target} (index: ${index})`);

        if (!target) return "";

        // 6. Extract value based on type
        switch (type) {
            case "innerText":
                return target.innerText?.trim() || "";
            case "attribute":
                return target.getAttribute(task.attribute) || "";
            case "element":
                return { selector: `xpath=${getElementXPath(target)}`, index: 0 };
            default:
                logToBackground("[store] UNKNOWN TYPE:", type);
                throw new Error(`Unknown store type: ${type}`);
        }
    },


    /**
     * Click an element
     */
    click: (task, variables) => {
        logToBackground("[click] START - Task:", task);
        logToBackground("[click] Variables:", variables);

        const selector = interpolate(task.selector, variables);
        logToBackground("[click] Interpolated selector:", selector);
        logToBackground("[click] Task index:", task.index);
        logToBackground("[click] Task wait:", task.wait);

        let element = null;

        // If both index and searchTxt are provided, filter by text and then select by index (0-based)
        if (task.index !== undefined && task.index !== null && task.searchTxt !== undefined && task.searchTxt !== null) {
            logToBackground("[click] Trying searchTxt + index method");
            const searchTxt = interpolate(task.searchTxt, variables).toLowerCase();
            const interpolatedIndex = interpolate(task.index, variables);
            const index = parseInt(interpolatedIndex, 10);

            if (!isNaN(index)) {
                let rawSelector = selector;
                if (rawSelector.startsWith('css=')) {
                    rawSelector = rawSelector.substring(4);
                }

                const elements = document.querySelectorAll(rawSelector);
                const filtered = Array.from(elements).filter((el) => {
                    try {
                        return el && typeof el.innerText === 'string' && el.innerText.toLowerCase().includes(searchTxt);
                    } catch (e) {
                        return false;
                    }
                });

                element = filtered[index] || null;

                if (element) {
                    logToBackground("[click] Element found by searchTxt + index");
                } else {
                    logToBackground("[click] Element NOT found by searchTxt + index");
                }
            }
        }

        // If an index is provided, click the Nth matching element (1-based index)
        if (!element && task.index !== undefined && task.index !== null) {
            const interpolatedIndex = interpolate(task.index, variables);
            logToBackground("[click] Interpolated index:", interpolatedIndex);

            const index = parseInt(interpolatedIndex, 10);
            logToBackground("[click] Parsed index:", index);

            if (!isNaN(index) && index > 0) {
                let rawSelector = selector;
                if (rawSelector.startsWith('css=')) {
                    rawSelector = rawSelector.substring(4);
                }

                logToBackground("[click] Raw selector for querySelectorAll:", rawSelector);

                const elements = document.querySelectorAll(rawSelector);
                logToBackground("[click] Total elements found:", elements.length);
                logToBackground("[click] Looking for element at index:", index - 1);

                element = elements[index - 1] || null;

                if (element) {
                    logToBackground("[click] Element found by index:", element);
                } else {
                    logToBackground("[click] Element NOT found by index");
                }
            }
        }

        // find the element whose innerText includes the given text.
        if (!element && task.searchTxt) {
            logToBackground("[click] Trying searchTxt method");
            const searchTxt = interpolate(task.searchTxt, variables);

            if (searchTxt) {
                let rawSelector = selector;
                if (rawSelector.startsWith('css=')) {
                    rawSelector = rawSelector.substring(4);
                }

                const elements = document.querySelectorAll(rawSelector);
                element = Array.from(elements).find((el) => {
                    try {
                        return el && typeof el.innerText === 'string' && el.innerText.includes(searchTxt);
                    } catch (e) {
                        return false;
                    }
                }) || null;

                if (element) {
                    logToBackground("[click] Element found by searchTxt");
                } else {
                    logToBackground("[click] Element NOT found by searchTxt");
                }
            }
        }

        // Fallback to previous logic (first matching element via resolveElement)
        if (!element) {
            logToBackground("[click] Trying fallback resolveElement method");
            element = resolveElement(selector);

            if (element) {
                logToBackground("[click] Element found by resolveElement");
            } else {
                logToBackground("[click] Element NOT found by resolveElement");
            }
        }


        if (element) {
            logToBackground("[click] About to click element:", element);
            logToBackground("[click] Element tag:", element.tagName);
            logToBackground("[click] Element className:", element.className);

            element.click();

            logToBackground(`[click] Clicked successfully - ${selector}`);
            logToBackground("[click] Task ID:", task.id);
            logToBackground("[click] Command:", task.command);
            logToBackground("[click] Variables after click:", variables);
            return true;
        } else {
            logToBackground("[click] ERROR - Element not found:", selector);
            throw new Error(`Element not found: ${selector}`);
        }
    },

    /**
     * Wait for element to be visible
     */
    waitForElementVisible: (task, variables) => {
        return new Promise((resolve, reject) => {
            const selector = interpolate(task.selector, variables);
            const timeout = task.timeout || 10000;
            const startTime = Date.now();

            const checkElement = () => {
                const element = resolveElement(selector);

                if (element && isElementVisible(element)) {
                    resolve(true);
                } else if (Date.now() - startTime > timeout) {
                    reject(new Error(`Timeout waiting for element: ${selector}`));
                } else {
                    setTimeout(checkElement, 100);
                }
            };

            checkElement();
        });
    },

    /**
     * Count elements matching a selector
     */
    selectorLength: (task, variables) => {
        const selector = interpolate(task.selector, variables);
        const contextElement = task.element
            ? resolveContextElement(task.element, variables)
            : document;

        if (!contextElement) {
            logToBackground("[selectorLength] Context element not found");
            return 0;
        }

        let elements = Array.from(contextElement.querySelectorAll(selector));

        if (task.searchTxt) {
            const searchTxt = interpolate(task.searchTxt, variables).toLowerCase();
            elements = elements.filter(el =>
                el && typeof el.innerText === 'string' && el.innerText.toLowerCase().includes(searchTxt)
            );
        }

        return elements.length;
    },

    /**
     * Store the current URL
     */
    storeUrl: (task, variables) => {
        return window.location.href;
    },

    /**
     * Open a URL
     */
    open: (task, variables) => {
        const url = interpolate(task.value, variables);
        window.location.href = url;
        return null;
    },


    /**
     * Scroll to a specific position
     */
    scrollToElement: (task, variables) => {
        const startIndex = parseInt(interpolate(task.startIndex, variables), 10) || 0;
        const scrollValue = parseInt(interpolate(task.scrollValue, variables), 10) || 0;

        window.scrollTo(startIndex, startIndex + scrollValue);
        return true;
    },

    /**
     * Get URL query parameter
     */
    urlParams: (task, variables) => {
        const paramName = interpolate(task.paramName, variables);
        const params = new URLSearchParams(window.location.search);
        const value = params.get(paramName);
        logToBackground(`[urlParams] ${paramName} = ${value}`);
        return value;
    },

    /**
     * Store Next Sibling
     */
    storeNextSibling: (task, variables) => {
        const element = resolveContextElement(task.element, variables);
        if (!element) {
            logToBackground("[storeNextSibling] Element not found");
            return null;
        }

        const sibling = element.nextElementSibling;
        if (!sibling) {
            logToBackground("[storeNextSibling] Next sibling not found");
            return null;
        }

        if (task.type === 'innerText') {
            return sibling.innerText?.trim() || "";
        } else {
            // Return descriptor
            const xpath = getElementXPath(sibling);
            return { selector: `xpath=${xpath}`, index: 0 };
        }
    },

    /**
     * Store Previous Sibling
     */
    storePrevSibling: (task, variables) => {
        const element = resolveContextElement(task.element, variables);
        if (!element) {
            logToBackground("[storePrevSibling] Element not found");
            return null;
        }

        const sibling = element.previousElementSibling;
        if (!sibling) {
            logToBackground("[storePrevSibling] Previous sibling not found");
            return null;
        }

        if (task.type === 'innerText') {
            return sibling.innerText?.trim() || "";
        } else {
            // Return descriptor
            const xpath = getElementXPath(sibling);
            return { selector: `xpath=${xpath}`, index: 0 };
        }
    },

    /**
     * Get item from sessionStorage
     */
    getSessionStorageItem: (task, variables) => {
        const key = interpolate(task.key, variables);
        const value = sessionStorage.getItem(key);
        logToBackground(`[getSessionStorageItem] key: ${key}, value: ${value}`);
        return value;
    },

    /**
     * Get item from localStorage
     */
    getLocalStorageItem: (task, variables) => {
        const key = interpolate(task.key, variables);
        const value = localStorage.getItem(key);
        logToBackground(`[getLocalStorageItem] key: ${key}, value: ${value}`);
        return value;
    },

    /**
     * Get last element child
     */
    storelastElementChild: (task, variables) => {
        const element = resolveContextElement(task.element, variables);
        if (!element) {
            logToBackground("[storelastElementChild] Element not found");
            return null;
        }

        const lastChild = element.lastElementChild;
        if (!lastChild) {
            logToBackground("[storelastElementChild] Last element child not found");
            return null;
        }

        if (task.type === 'innerText') {
            return lastChild.innerText?.trim() || "";
        } else {
            const xpath = getElementXPath(lastChild);
            return { selector: `xpath=${xpath}`, index: 0 };
        }
    },


    /**
    * Get parent element
    */
    storeParentElement: (task, variables) => {
        const selector = interpolate(task.selector, variables);
        const element = resolveElement(selector);
        if (!element) {
            logToBackground("[storeParentElement] Element not found");
            return null;
        }

        const parent = element.parentElement;
        if (!parent) {
            logToBackground("[storeParentElement] Parent not found");
            return null;
        }

        const xpath = getElementXPath(parent);
        return { selector: `xpath=${xpath}`, index: 0 };
    },

    /**
     * Get window.location.pathname
     */
    storePathValue: (task, variables) => {
        const pathValue = window.location.pathname;
        logToBackground(`[storePathValue] pathname: ${pathValue}`);
        return pathValue;
    },

    /**
     * Split string by separator
     */
    splitString: (task, variables) => {
        const fullString = interpolate(task.fullString, variables);
        const separator = interpolate(task.separator, variables);
        const result = fullString ? fullString.split(separator) : [];
        logToBackground(`[splitString] fullString: ${fullString}, separator: ${separator}, result:`, result);
        return result;
    },

    /**
     * Get closest ancestor matching selector
     */
    storeclosest: (task, variables) => {
        const element = resolveContextElement(task.element, variables);
        if (!element) {
            logToBackground("[storeclosest] Element not found");
            return null;
        }

        const selector = interpolate(task.selector, variables);
        const closest = element.closest(selector);
        if (!closest) {
            logToBackground(`[storeclosest] Closest element not found for selector: ${selector}`);
            return null;
        }

        if (task.type === 'innerText') {
            return closest.innerText?.trim() || "";
        } else {
            const xpath = getElementXPath(closest);
            return { selector: `xpath=${xpath}`, index: 0 };
        }
    },

    /**
     * Get first element child
     */
    storeFirstElementChild: (task, variables) => {
        const element = resolveContextElement(task.element, variables);
        if (!element) {
            logToBackground("[storeFirstElementChild] Element not found");
            return null;
        }

        const firstChild = element.firstElementChild;
        if (!firstChild) {
            logToBackground("[storeFirstElementChild] First element child not found");
            return null;
        }

        if (task.type === 'innerText') {
            return firstChild.innerText?.trim() || "";
        } else {
            const xpath = getElementXPath(firstChild);
            return { selector: `xpath=${xpath}`, index: 0 };
        }
    },

    /**
     * Get cookie item by key
     */
    getCookieItem: (task, variables) => {
        const key = interpolate(task.key, variables);
        const value = document.cookie
            .split("; ")
            .find(row => row.startsWith(key + "="))
            ?.split("=")[1] || null;
        logToBackground(`[getCookieItem] key: ${key}, value: ${value}`);
        return value;
    },

    /**
     * Finds and replaces a substring within a string
     */
    replaceString: (task, variables) => {
        const fullString = interpolate(task.fullString, variables);
        const findStr = interpolate(task.find, variables);
        const replaceStr = task.replace !== undefined ? interpolate(task.replace, variables) : "";
        if (!fullString) return "";
        const result = String(fullString).split(String(findStr)).join(String(replaceStr));
        logToBackground(`[replaceString] fullString: ${fullString}, find: ${findStr}, replace: ${replaceStr}, result: ${result}`);
        return result;
    },

    /**
     * Reads a computed CSS style property of a DOM element
     */
    storeStyleValue: (task, variables) => {
        const element = resolveContextElement(task.element, variables);
        if (!element) {
            logToBackground("[storeStyleValue] Element not found");
            return null;
        }
        const property = interpolate(task.property, variables);
        if (!property) {
            logToBackground("[storeStyleValue] Property not specified");
            return null;
        }
        const value = window.getComputedStyle(element).getPropertyValue(property);
        logToBackground(`[storeStyleValue] property: ${property}, value: ${value}`);
        return value;
    },

    initiateArray: () => [],

    initiateObject: () => ({}),
};


function resolveContextElement(elementDesc, variables) {
    if (!elementDesc) return null;
    const desc = interpolate(elementDesc, variables);
    return resolveElement(desc);
}

function getElementXPath(element) {
    if (!element || element.nodeType !== 1) return '';
    if (element.id) return `//*[@id="${element.id}"]`;

    const idx = (sib) => {
        let count = 1;
        for (let s = sib.previousElementSibling; s; s = s.previousElementSibling) {
            if (s.localName === sib.localName) count++;
        }
        return count;
    };

    const segs = [];
    for (; element && element.nodeType === 1; element = element.parentNode) {
        if (element.id) {
            segs.unshift(`*[@id="${element.id}"]`);
            return `//${segs.join('/')}`;
        } else {
            let tag = element.localName.toLowerCase();
            segs.unshift(`${tag}[${idx(element)}]`);
        }
    }
    return segs.length ? '/' + segs.join('/') : null;
}



/**
 * Resolve an element from a selector string (supports css= and xpath= prefixes)
 */
function resolveElement(selectorOrDesc, context = document) {
    if (!selectorOrDesc) return null;

    let selector = selectorOrDesc;
    let index = 0;

    if (typeof selectorOrDesc === 'object' && selectorOrDesc.selector) {
        selector = selectorOrDesc.selector;
        index = parseInt(selectorOrDesc.index) || 0;
    }

    if (typeof selector !== 'string') {
        logToBackground("[resolveElement] Selector is not a string:", selector);
        return null;
    }

    if (selector.startsWith('xpath=')) {
        const xpath = selector.substring(6);
        try {
            // Use FIRST_ORDERED_NODE_TYPE (9) for index 0 (matches console behavior)
            if (index === 0) {
                const result = document.evaluate(xpath, context, null, 9, null);
                const node = result.singleNodeValue;
                if (!node) logToBackground(`[resolveElement] XPath not found (index 0): ${xpath}`);
                return node;
            } else {
                const result = document.evaluate(xpath, context, null, 7, null);
                if (result.snapshotLength > index) {
                    return result.snapshotItem(index);
                } else {
                    logToBackground(`[resolveElement] XPath index out of bounds: ${xpath} (found ${result.snapshotLength}, needed ${index})`);
                    return null;
                }
            }
        } catch (e) {
            logToBackground(`[resolveElement] XPath error: ${e.message} for ${xpath}`);
            return null;
        }
    }

    // Default to CSS selector (handles 'css=' prefix or no prefix)
    let cssSelector = selector.startsWith('css=') ? selector.substring(4) : selector;

    // Optimization: if index is 0, use querySelector for performance
    if (index === 0) {
        const el = context.querySelector(cssSelector);
        if (!el) logToBackground(`[resolveElement] CSS not found: ${cssSelector}`);
        return el;
    } else {
        const nodes = context.querySelectorAll(cssSelector);
        const el = nodes[index] || null;
        if (!el) logToBackground(`[resolveElement] CSS index out of bounds: ${cssSelector}`);
        return el;
    }
}

/**
 * Check if an element is visible
 */
function isElementVisible(element) {
    if (!element) return false;

    const style = window.getComputedStyle(element);
    return style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0' &&
        element.offsetParent !== null;
}

function resolveURL(params) {
    const url = params.url;
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return params.baseUrl + url;
}

function getAsinObj(params) {
    const selectors = params.selectors;
    let asinObj = [];
    let items = [];
    let deliveryStatus = "Delivered";
    if (window.location.pathname.includes("ship-track")) {
        items = Array.from(document.querySelectorAll(selectors[0]));
        const statusEl = document.querySelector(selectors[1]);
        if (statusEl) deliveryStatus = statusEl.innerText;
    } else if (window.location.pathname.includes("your-orders")) {
        items = Array.from(document.querySelectorAll(selectors[2]));
        const statusEl = document.querySelector(selectors[3]);
        if (statusEl) deliveryStatus = statusEl.innerText;
    }
    items.forEach((item) => {
        const parsedUrl = new URL(item.href);
        const pathSegments = parsedUrl.pathname.split("/").filter(Boolean);
        const ASINnumber = pathSegments[pathSegments.length - 1];
        asinObj.push({
            asin: ASINnumber,
            deliveryStatus: deliveryStatus.trim().replace(/\s+/g, " ").replace(/"/g, "&#034").replace(/'/g, "&#039").replace("\u000A", " "),
        });
    });
    return asinObj;
}

function extractSubstring(params) {
    const { fullString, stringAfter, stringBefore } = params;
    if (!fullString) return "";
    let result = fullString;
    if (stringAfter) {
        const index = result.indexOf(stringAfter);
        if (index !== -1) result = result.substring(index + stringAfter.length);
    }
    if (stringBefore) {
        const index = result.indexOf(stringBefore);
        if (index !== -1) result = result.substring(0, index);
    }
    return result;
}

// Task Execution
async function executeTask(task, variables) {
    const command = task.command;
    const handler = nodeHandlers[command];

    if (!handler) {
        throw new Error(`Unknown command: ${command}`);
    }

    console.log(`[ContentScript] Executing node: ${command} (Task ${task.id})`);

    const result = await handler(task, variables);

    return result;
}

//Receive tasks from background
extensionCommunicationPort.onMessage.addListener(async (msg) => {
    console.log("[ContentScript] Received message:", msg);

    if (msg.type === 'EXECUTE_TASK') {
        const { task, variables } = msg;

        try {
            const result = await executeTask(task, variables);

            // For 'open' command, the page will navigate and this script will be destroyed
            // so we don't send TASK_COMPLETE (background.js waits for PAGE_READY from new page)
            if (task.command === 'open') return;

            // For click commands, always send TASK_COMPLETE
            // background.js will handle the wait logic with a timeout for PAGE_READY
            extensionCommunicationPort.postMessage({
                type: 'TASK_COMPLETE',
                taskId: task.id || 'unknown',
                success: true,
                result: result,
                error: null
            });

            console.log(`[ContentScript] Task ${task.id} completed successfully`);

        } catch (error) {
            extensionCommunicationPort.postMessage({
                type: 'TASK_COMPLETE',
                taskId: task.id || 'unknown',
                success: false,
                result: null,
                error: error.message
            });

            console.error(`[ContentScript] Task ${task.id} failed:`, error);
        }
    }
});

window.addEventListener('load', () => {
    extensionCommunicationPort.postMessage({
        type: 'PAGE_READY'
    });
});


function logToBackground(...args) {
    console.log(...args);
    extensionCommunicationPort.postMessage({
        type: "CONTENT_LOG",
        payload: args.map(a =>
            typeof a === "object" ? JSON.stringify(a) : String(a)
        )
    });
}
