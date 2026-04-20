// orderTotle = document.querySelector(".price-summary").innerText;
// document.querySelector(".input-box-div input").value = "NEW30";
// document.querySelector(".rilrtl-button.button.apply-button ").click();
// remove coupoun = document.querySelector(".input-area div > span:last-child").click();

//   setTimeout(() => {
//     let errorMessage = document.querySelector(".voucher-error")?innerText;
//     if (errorMessage) {
//       console.log("Error Message: " + errorMessage.innerText);
//       return;
//     }
//   }, 2000);

//   setTimeout(() => {
//     let newPrice = Number(productPrice.innerText.replace(/[^0-9.]/g, ""));
//     console.log("after price: " + productPrice.innerText);

//     let discountAmount = oldPrice - newPrice;
//     console.log("Discount Amount: " + discountAmount);
//   }, 2000);

// let obj = {
//     oldPrice : oldPrice,
//     newPrice : newPrice,
//     DiscountAmount : discountAmount,
//     ErrorMessage : errorMessage
// };

//   info.push(obj);

//   setTimeout(() => {
//     let removeCoupon = document.querySelector(".input-area div > span:last-child");
//     simulateMouseClick(removeCoupon);
//   }, 2000);

//   console.log(info);

function couponApplyCheck() {
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

  let promise = new Promise((resolve) => {
    let productPrice = document.querySelector("#orderTotal");
    let couponInput = document.querySelector(".input-box-div input");
    let button = document.querySelector(".input-box-div button");

    let oldPrice = Number(productPrice.innerText.replace(/[^0-9.]/g, ""));

    simulateTyping(couponInput, "NEW30");
    simulateMouseClick(button);

    setTimeout(() => {

      // from here
      let errorEl = document.querySelector(".voucher-error");
      let errorMessage = "";
      isValid = true;

      if (errorEl && errorEl.innerText.trim() !== "") {
        errorMessage = errorEl.innerText;
        isValid = false;
      }
      // to here except isValid 
      // i use chatgpt for error message 
      // i am using direct but not work
      //  let errorMessage = document.querySelector(".voucher-error")?innerText;

      let newPrice = Number(productPrice.innerText.replace(/[^0-9.]/g, ""));
      // and this replace formula from chatgpt that it.
      let discountAmount = oldPrice - newPrice;

      let info = [
        {
          oldPrice: oldPrice,
          newPrice: newPrice,
          DiscountAmount: discountAmount,
          ErrorMessage: errorMessage,
          isValid: isValid,
        },
      ];

      resolve(info);
    }, 2000);
  });

  promise
    .then((value) => {
      if (value[0].isValid) {
        console.log("Valid Coupon Code:", value);
        let removeCoupon = document.querySelector(
          ".input-area div > span:last-child"
        );
        simulateMouseClick(removeCoupon);
      } else {
        console.log("Invalid Coupon Code:", value);
        let deleteCoupon = document.querySelector(".input-area span");
        simulateMouseClick(deleteCoupon);
      }
    })
    .catch((error) => {
      console.log(error);
    });
}

couponApplyCheck();
