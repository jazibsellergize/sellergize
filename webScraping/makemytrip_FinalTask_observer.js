async function applyCouponCheck() {
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

  let input = document.querySelector(".promocodeWrapV2 input");
  let price = document.querySelector(".fareFooter span:last-child");
  let oldPrice = Number(price.innerText.replace(/[^0-9.]/g, ""));

  let codeList = [
    "HDFCEMI",
    "huakd",
    "MMTSECURE",
    "MMTSUPER",
    "ukalonrt",
    "HDFCEMI",
    "FLYMONEMI",
    "gtmky",
    "AVAILUPI",
  ];

  let result = [];

  //   let couponCodes = document.querySelectorAll(".promoContentV2");

  //   couponCodes.forEach((i) => {
  //     let code = i.querySelector(".couponCodeV2").innerText.trim();
  //     codeList.push(code);
  //   });

  for (let code of codeList) {
    console.log("Code Enter ----- ", code);

    simulateTyping(input, code);

    let applyBtn = document.querySelector(".cpnTriggerV2 b");
    simulateMouseClick(applyBtn);
    console.log("Apply Button clicked");

    await waitUntilSettle();

    let applyCode = document
      .querySelector(".commonOverlay div span:nth-child(2)")
      ?.innerText?.replace(/"|applied/gi, "")
      .trim();

    await waitUntilSettle();

    let message = "";
    let description = document
      .querySelector(".promoCheckContentV2 font")
      .innerText.trim();
    let newPrice = Number(price.innerText.replace(/[^0-9.]/g, ""));
    let discount = 0;

    if (code !== applyCode) {
      console.log("Invalid Coupon ----- [" + code + " === " + applyCode + "]");

      oldPrice = oldPrice;
      discount = 0;
      newPrice = oldPrice;
      description = description;
      message = "Invalid Coupon";
    } else {
      console.log("Valid Coupon ----- [" + code + " === " + applyCode + "]");

      oldPrice = oldPrice;
      discount = oldPrice - newPrice;
      newPrice = newPrice;
      description = description;
      message = "Valid Coupon";
    }

    result.push({
      code,
      oldPrice,
      discount,
      newPrice,
      description,
      message,
      url: "https://www.makemytrip.com/",
    });

    let popUp = document.querySelector(".commonOverlay span");
    simulateMouseClick(popUp);

    await waitUntilSettle();

    let removeBtn = document.querySelector(".removeCta b");
    simulateMouseClick(removeBtn);

    await waitUntilSettle();

    let popup2 = document.querySelector(".couponV2OverlayWrapper font");
    simulateMouseClick(popup2);

    await waitUntilSettle();
  }

  console.log("All Coupon Data ---- ", result);
  return result;
}

await applyCouponCheck();
