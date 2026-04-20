let promise = new Promise((resolve, reject) => {
  setTimeout(() => {
    let offerInfo = document.querySelectorAll(".promotion-card");
    let offerList = [];

    if (offerInfo.length === 0) {
      reject("No Offers Found");
      return;
    }

    offerInfo.forEach((i) => {
      let img = i.querySelector(".promotion-card img")?.getAttribute("src");
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

    resolve(offerList);
  }, 3000);
});

promise
  .then((value) => {
    localStorage.setItem("crawl_data", JSON.stringify(value));
    return JSON.stringify(value);
  })
  .catch((error) => {
    console.log(error);
  });

// promise
//   .then((value) => {
//     console.log(value);
//   })
//   .catch((error) => {
//     console.log(error);
//   });
