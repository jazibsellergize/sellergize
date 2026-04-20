function offerApplyCheck() {
  let title = document.querySelector(".flDetailHdr h2").innerText;
  let input = document.querySelector(".promocodeWrapV2 input");
  let price = document.querySelector(".fareFooter span:last-child");
 

// let couponCodes = document.querySelectorAll(".promoContentV2");
// let couponCode = document.querySelectorAll(".couponCodeV2");
// let couponDescription = document.querySelectorAll(".promoCheckContentV2 font")[0].innerText;


  const simulateMouseClick = (element) => {
    if (!element) return;
    ["mouseover", "mousedown", "mouseup", "click"].forEach((e) =>
      element.dispatchEvent(
        new MouseEvent(e, { bubbles: true, cancelable: true }),
      ),
    );
  };

  const simulateTyping = (element, text) => {
    element.focus();
    element.value = "";
    element.dispatchEvent(new Event("input", { bubbles: true }));

    setTimeout(() => {
      let lastValue = element.value;
      element.value = text;

      let tracker = element._valueTracker;
      if (tracker) tracker.setValue(lastValue);

      element.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true }));
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
    }, 100);
  };

  let promise = new Promise((resolve) => {
    let oldPrice = Number(price.innerText.replace(/[^0-9.]/g, ""));
    console.log("Before price: " + oldPrice);

    let couponCodes = document.querySelectorAll(".promoContentV2");

    couponCodes.forEach((i) => {

      let code = i.querySelector(".couponCodeV2").innerText.trim();
      let description = i.querySelector(".promoCheckContentV2 font").innerText.trim();

      simulateTyping(input, code);

      setTimeout(() => {
        let applyBtn = document.querySelector(".cpnTriggerV2 b");
        console.log("Clicking apply for value:", input.value);
        simulateMouseClick(applyBtn);
      }, 600);

      setTimeout(() => {

        let code = document.querySelector(".commonOverlay div span:nth-child(2)").innerText.replace(/"|applied/g, "").trim();
        let errorMessage = document.querySelector(".commonOverlay p");

        let MessageCheck = "";
        let type = "";
        let newPrice = 0;
        let discountAmount = 0;

        if (errorMessage && errorMessage.innerText.trim() !== "") {
          MessageCheck = errorMessage.innerText;
        }
        console.log("code ----- : " + code);
        if (MessageCheck.includes("isn't available") && input.value !== code) {
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

        resolve([
          {
            title: title,
            code: code,
            description: description,
            oldPrice: oldPrice,
            newPrice: newPrice,
            DiscountAmount: discountAmount,
            Message: Message,
            type: type
          }
        ]);
      }, 3500);
    });
  });

  promise
    .then((value) => {

      console.log("Info:", value);

      setTimeout(() => {
        let popUp = document.querySelector(".commonOverlay span");

        simulateMouseClick(popUp);
        let removeBtn = document.querySelector(".removeCta b");

        simulateMouseClick(removeBtn);

        setTimeout(() => {
          let popUp2 = document.querySelector(".couponV2OverlayWrapper font");

          simulateMouseClick(popUp2);
        }, 1000);

      }, 1000);
    })
    .catch((error) => console.error("Error:", error));
}

offerApplyCheck();