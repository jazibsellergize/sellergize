(async () => {
  const couponCode = "AVAILUPI";

  const input = document.querySelector(".promocodeWrapV2 input");

  if (!input) {
    console.log("no input!");
    return;
  }

  let oldPrice = document.querySelector(".fareFooter span:last-child").innerText;

  input.focus();
  input.value = couponCode;

  await new Promise((a) => setTimeout(a, 2000));

  const applyBtn = document.querySelector(".promocodeWrapV2 b");

  if (!applyBtn) {
    console.log("no apply btn");
    return;
  }

  applyBtn.click();
  console.log("Clicked apply button");

  await new Promise((r) => setTimeout(r, 5000));

  const error = document.querySelector(".commonOverlay p").innerText;

  if (error) {
    console.log(error);
    return;
  }

  let newPrice = document.querySelector(".fareFooter span:last-child").innerText;

  if (oldPrice && newPrice && newPrice < oldPrice) {
    const discount = oldPrice - newPrice;
  }
});