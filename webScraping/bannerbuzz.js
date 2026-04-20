
// https://www.bannerbuzz.com/coupons (offer and list)

document.querySelector(".couponImage img");
document.querySelector(".couponOffer p");
document.querySelector(".couponCode button");
document.querySelector(".expiresDate");

let bannerInfo = document.querySelectorAll(".offersMain, .width100 li");

let bannerList = [];

bannerInfo.forEach(i => {

    let img = i.querySelector("img")?.getAttribute("src");
    let title = i.querySelector("h4")?.innerText;
    if (!title) {
        title = i.querySelector("a")?.innerText;
    }
    let description = i.querySelector("p")?.innerText;
    let code = i.querySelector("h4")?.innerText;
    let expire = i.querySelector(".expiresDate")?.innerText;
    let url = i.querySelector("a")?.getAttribute("href");
    let type = code ? "Code" : "Deal";

    url = (url.startsWith("https")) ? url : "https://www.bannerbuzz.com" + url;

    let bannerObj = {
        img: img,
        title: title,
        description : description,
        code: code,
        expire: expire,
        url: url,
        type: type
    };

    bannerList.push(bannerObj);

});

localStorage.setItem("crawl_data", JSON.stringify(bannerList));
return JSON.stringify(bannerList);

//console.log(bannerList);