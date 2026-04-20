// https://www.famousfootwear.ca/en/klarna

let shadowParent = document.querySelector("klarna-placement").shadowRoot;
let c = shadowParent.querySelectorAll(
  ".columns, .section-item.payment-method, .journey-step",
);
let offerArr = [];

c.forEach((i) => {
  let img = i.querySelector("img")?.getAttribute("src");
  let title = i.querySelector("h2, p")?.innerText;
  let description = i.querySelector("p")?.innerText;

  let obj = {
    img: img,
    title: title,
    description: description,
  };

  offerArr.push(obj);
});
localStorage.setItem("crawl_data", JSON.stringify(offerArr));
return JSON.stringify(offerArr);

console.log(offerArr);
