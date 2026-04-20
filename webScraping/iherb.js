// https://in.iherb.com/info/sales-and-offers

document.querySelector(".promotion-card img").getAttribute("src");
document.querySelector(".promotion-card a").getAttribute("href");
document.querySelector(".promo-expires-at").innerText;
document.querySelector(".promo-text-content").innerText;
document.querySelector(".no-promo-code").innerText;
document.querySelector("#promo-code").value;

let offerInfo = document.querySelectorAll(".promotion-card");
let offerList = [];

offerInfo.forEach((i) => {
  let img = i.querySelector("img")?.getAttribute("src");
  let src = i.querySelector("a")?.getAttribute("href");
  let expire = i.querySelector(".promo-expires-at")?.innerText;
  let description = i.querySelector(".promo-text-content")?.innerText;
  let code = i.querySelector("#promo-code")?.value;
  let type = code ? "Code" : "Deal";

  let offerObj = {
    img: img,
    src: src,
    expire: expire,
    description: description,
    code: code,
    type: type,
  };

  offerList.push(offerObj);
});
localStorage.setItem("crawl_data", JSON.stringify(offerList));
return JSON.stringify(offerList);
//console.log(offerList);
