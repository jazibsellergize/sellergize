async function scrape() {
  try {
    let value = await new Promise((resolve, reject) => {
      setTimeout(() => {
        let offerInfo = document.querySelectorAll(".promotion-card");
        let offerList = [];

        if (offerInfo.length === 0) {
          reject("No Offers Found");
          return;
        }

        offerInfo.forEach((i) => {
          let img = i.querySelector("img")?.getAttribute("src");
          let src = i.querySelector("a")?.getAttribute("href");
          let expire = i.querySelector(".promo-expires-at")?.innerText;
          let description = i.querySelector(".promo-text-content")?.innerText;
          let code = i.querySelector("#promo-code")?.value;
          let type = code ? "Code" : "Deal";

          offerList.push({ img, src, expire, description, code, type });
        });

        resolve(offerList);
      }, 3000);
    });

    localStorage.setItem("crawl_data", JSON.stringify(value));
    console.log(value);

  } catch (error) {
    console.log(error);
  }
}

scrape();