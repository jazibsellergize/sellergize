let price = document.querySelector(
  "#proceedToCheckout span:last-child",
).innerText;
let input = (document.querySelector("#coupon-input").value = "NEW20");
let applyBtn = document.querySelector("#coupon-apply").click();
let errorMsg = document.querySelector(
  "span[data-qa-element='invalid-message']",
).innerText;
let removeBtn = document.querySelector("button[data-qa-element='remove-code-btn']").click();


function offerApplyCheck() {
  let input = document.querySelector("#coupon-input");
  let applyBtn = document.querySelector("#coupon-apply");
  let price = document.querySelector("#proceedToCheckout span:last-child");

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
    let oldPrice = Number(price.innerText.replace(/[^0-9.]/g, ""));
    console.log("Before price: " + oldPrice);

    simulateTyping(input, "NEW20");
    simulateMouseClick(applyBtn);

    setTimeout(() => {
      let errorMessage = document.querySelector(
        "span[data-qa-element='invalid-message']"
      );
      let Message = "";
      let isValid = true;

      if (errorMessage && errorMessage.innerText.trim() !== "") {
        Message = errorMessage.innerText;
        isValid = false;
      }

      newPrice = Number(price.innerText.replace(/[^0-9.]/g, ""));
      console.log("After price: " + newPrice);
      discountAmount = oldPrice - newPrice;

      let info = [
        {
          oldPrice: oldPrice,
          newPrice: newPrice,
          DiscountAmount: discountAmount,
          Message: Message,
          isValid: isValid,
        },
      ];

      resolve(info);
    }, 3500);
  });

  promise
    .then((value) => {
      
        if(value[0].isValid){
            console.log("successfull", value);
            let removeBtn = document.querySelector("button[data-qa-element='remove-code-btn']");
            simulateMouseClick(removeBtn);
            
        }else{
            console.log("Not successfull", value);
        }
      
    
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

offerApplyCheck();
