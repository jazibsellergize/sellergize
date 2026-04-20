async function checkCoupon() {
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

  const checkElement = (selector) => {
    return new Promise((resolve) => {
      let existing = document.querySelector(selector);
      if (existing) return resolve(existing);

      const observer = new MutationObserver((mutations) => {
        for (let m of mutations) {
          for (let node of m.addedNodes) {
            if (
              node.nodeType === 1 &&
              (node.matches(selector) || node.querySelector(selector))
            ) {
              observer.disconnect();

              let element = node.matches(selector)
                ? node
                : node.querySelector(selector);

              resolve(element);
            }
          }
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    });
  };

  const removeElement = (selector) => {
    return new Promise((resolve) => {
      if (!document.querySelector(selector)) {
        return resolve();
      }

      const observer = new MutationObserver(() => {
        let el = document.querySelector(selector);

        if (!el) {
          observer.disconnect();
          resolve();
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    });
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

  let codeList = ["JKCLIQ", "SBIVISADCF"];

  for (let code of codeList) {
    console.log("Code - ", code);
    let openCouponWindow = document.querySelector(".Coupon__wrapper");
    simulateMouseClick(openCouponWindow);

    await waitUntilSettle();

    // let couponPanel = ".ProductCouponDetails__base";
    // await checkElement(couponPanel);
    // console.log("Panel open for coupon");

    let input = document.querySelector("input[data-test='coupon-input-field']");
    let apply_remove_Btn = document.querySelector(
      ".SearchCupon__buttonCover div",
    );

    simulateTyping(input, code);
    console.log("Input code");

    simulateMouseClick(apply_remove_Btn);
    console.log("click apply btn");

    let pop2 = ".CelebrationPopUp__cuponCode";

    await Promise.race([
      // case 1: popup comes
      checkElement(pop2).then(() => removeElement(pop2)),

      // case 2: no popup → wait UI settle
      await waitUntilSettle(),
    ]);

    console.log("apply handled");

    // await removeElement(pop2);
    // console.log("popup remove");

    simulateMouseClick(openCouponWindow);
    console.log("open again coupon panel to remove coupon");

    await waitUntilSettle();

    let removeBtn = document.querySelector(".SearchCupon__buttonCover div");
    simulateMouseClick(removeBtn);
    console.log("remove coupon successfully");

    await waitUntilSettle();
  }
}

await checkCoupon();
