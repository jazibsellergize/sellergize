async function offerApplyCheck() {
  let sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  let title = document.querySelector(".flDetailHdr h2").innerText;
  let input = document.querySelector(".promocodeWrapV2 input");
  let price = document.querySelector(".fareFooter span:last-child");

  let result = [];

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

  let oldPrice = Number(price.innerText.replace(/[^0-9.]/g, ""));
  console.log("Before price: " + oldPrice);

  let codeList = [
    "MMTSECURE",
    "yudfwtwqfd",
    "RUPAYICICI",
    "sftuak",
    "MMTRUPAYCC",
  ];

  for (let code of codeList) {
    await simulateTyping(input, code);
    await sleep(1000);

    let applyBtn = document.querySelector(".cpnTriggerV2 b");
    console.log("Clicking apply for value:", input.value);
    simulateMouseClick(applyBtn);

    await sleep(3500);

    let applyCode = document
      .querySelector(".commonOverlay div span:nth-child(2)")
      .innerText.replace(/"|applied/g, "")
      .trim();

    let type = "";
    let newPrice = 0;
    let discountAmount = 0;
    console.log("code ----- : " + code);

    if (code !== applyCode) {
      newPrice = 0;
      discountAmount = 0;
      type = "";
      Message = "Invalid Coupon";
    } else {
      newPrice = Number(price.innerText.replace(/[^0-9.]/g, ""));
      console.log("After price: " + newPrice);
      discountAmount = oldPrice - newPrice;
      type = "Code";
      Message = "Coupon Applied Successfully";
    }

    let obj = {
      title: title,
      code: code,
      //description: description,
      oldPrice: oldPrice,
      newPrice: newPrice,
      DiscountAmount: discountAmount,
      Message: Message,
      type: type,
      url: "https://www.makemytrip.com/",
    };
    result.push(obj);

    let popUp = document.querySelector(".commonOverlay span");
    simulateMouseClick(popUp);
    await sleep(1000);

    let removeBtn = document.querySelector(".removeCta b");
    simulateMouseClick(removeBtn);
    await sleep(1000);

    let popUp2 = document.querySelector(".couponV2OverlayWrapper font");
    simulateMouseClick(popUp2);
    await sleep(1000);
  }
  console.log("Info:", result);
  localStorage.setItem("crawl_data", JSON.stringify(result));
  return JSON.stringify(result);
}
await offerApplyCheck();

// reviewTravellerAddons : top parent element class
