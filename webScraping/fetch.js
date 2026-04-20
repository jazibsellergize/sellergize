async function scrape() {
  let url = "https://in.iherb.com/info/sales-and-offers";

  try {
    let value = await new Promise(async (resolve, reject) => {
      try {
        // 🔹 fetch inside Promise
        let res = await fetch(url);

        if (!res.ok) {
          reject("Fetch failed");
          return;
        }

        let html = await res.text();

        // 🔹 delay using setTimeout
        setTimeout(() => {
          let parser = new DOMParser();
          let doc = parser.parseFromString(html, "text/html");

          let offerInfo = doc.querySelectorAll(".promotion-card");
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

          resolve(offerList); // final result
        }, 3000);

      } catch (err) {
        reject(err);
      }
    });

    // 🔹 after await
    localStorage.setItem("crawl_data", JSON.stringify(value));
    console.log("Scraped Data:", value);

  } catch (error) {
    console.log("Error:", error);
  }
}

scrape();