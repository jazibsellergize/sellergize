async function scrape() {
  let url =
    "https://www.yatra.com/offer/dom/listing/international-flight-deals";

  try {
    let value = await new Promise(async (resolve, reject) => {
      try {
        let res = await fetch(url, {
          method: "GET",
          headers: {
            "user-agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
          },
        });

        if (!res.ok) {
          reject("Offer Not Found");
          return;
        }

        let html = await res.text();

        setTimeout(() => {
          let parser = new DOMParser();
          let dom = parser.parseFromString(html, "text/html");

          let offerInfo = dom.querySelectorAll(".eventListTrackable");

          let offerList = [...offerInfo].map((i) => {
            let link = i.querySelector("a")?.href;

            // if (link.startsWith("https")) {
            //   link = link;
            // } else if (link?.includes("javascript")) {
            //   link = "https://www.yatra.com/";
            // } else {
            //   link = "https://www.yatra.com" + link;
            // }

           
            if (link?.includes("javascript")) {
              link = "https://www.yatra.com/";
            }

            let code = i.querySelector("p")?.innerText;
            let finalCode = code?.toLocaleLowerCase().includes("coupon")
              ? code.split(":")[1].trim()
              : null;

            return {
              img: i.querySelector("img")?.src,
              title: i.querySelector(".offerMainTitle")?.innerText,
              code: finalCode,
              expire: i.querySelector("span[class*='validity']")?.innerText,
              url: link,
              type: finalCode ? "Code" : "Deal",
            };
          });

          resolve(offerList);
        }, 2000);
      } catch (error) {
        reject(error);
      }
    });
    localStorage.setItem("crawl_data", JSON.stringify(value));
    return JSON.stringify(value);
  } catch (error) {
    console.log(error);
  }
}

await scrape();
