const simulateMouseClick = (element) => {
  if (!element) return;
  ["mouseover", "mousedown", "mouseup", "click"].forEach((e) =>
    element.dispatchEvent(
      new MouseEvent(e, { bubbles: true, cancelable: true }),
    ),
  );
};

const simulateTyping = (element, text) => {
  let lastValue = element.value;
  element.value = text;
  let tracker = element._valueTracker;
  if (tracker) tracker.setValue(lastValue);
  const eventOptions = { bubbles: true, cancelable: true };

  element.dispatchEvent(new Event("input", eventOptions));
  element.dispatchEvent(new Event("change", eventOptions));
  element.dispatchEvent(new Event("focusin", eventOptions));
};

const waitUntilSettle = (
  maxWait = 10000,
  settleTime = 2000,
  maxChanges = 1000,
) => {
  return new Promise((resolve) => {
    let settleTimer;
    let maxTimer;
    let changeCount = 0;
    let isResolved = false;

    const cleanup = (reason) => {
      if (isResolved) return;
      isResolved = true;

      clearTimeout(settleTimer);
      clearTimeout(maxTimer);
      observer.disconnect();

      resolve(reason); // "settled" | "maxChanges" | "maxWait"
    };

    const observer = new MutationObserver((mutations) => {
      const elementChanges = mutations.reduce((count, m) => {
        const changes = [...m.addedNodes, ...m.removedNodes].filter(
          (node) => node.nodeType === Node.ELEMENT_NODE,
        ).length;
        return count + changes;
      }, 0);

      if (elementChanges === 0) return;

      changeCount += elementChanges;

      // Stop if 1000 changes reached
      if (changeCount >= maxChanges) {
        cleanup("maxChanges");
        return;
      }

      // Reset settle timer
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => cleanup("settled"), settleTime);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Initial settle timer
    settleTimer = setTimeout(() => cleanup("settled"), settleTime);

    // Hard max time
    maxTimer = setTimeout(() => cleanup("maxWait"), maxWait);
  });
};
