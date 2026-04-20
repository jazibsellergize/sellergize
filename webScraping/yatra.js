// code = document.querySelectorAll(".eventListTrackable p")[0].innerText;
// expiry = document.querySelectorAll(
//   ".eventListTrackable span[class*='validity']",
// )[0].innerText;
// title = document.querySelectorAll(".eventListTrackable .offerMainTitle")[0]
//   .innerText;
// img = document.querySelectorAll(".eventListTrackable img")[0].src;
// url = document.querySelectorAll(".eventListTrackable a")[0].href;

async function scrape() {
    
  let url = "https://www.yatra.com/offer/dom/listing/domestic-flight-deals";

  try {

    let value = await new Promise(async (resolve, reject) => {

      try{

        let res = await fetch(url);

        if(!res.ok){
            reject("Offer Not Found");
            return;
        }
        
        let html = await res.text();

        setTimeout(() => {
            
            let parser = new DOMParser();
            let dom = parser.parseFromString(html, "text/html");

            let offerInfo = dom.querySelectorAll(".eventListTrackable");
            let offerList = [];

            offerInfo.forEach(i=> {

                let img = i.querySelector("img")?.src;
                let title = i.querySelector(".offerMainTitle")?.innerText;
                let code = i.querySelector("p")?.innerText;
                let expire = i.querySelector("span[class*='validity']")?.innerText;
                let url = i.querySelector("a")?.href;

                offerList.push({img, title, code, expire, url});
            });

            resolve(offerList);

        }, 3000);

      }catch (error){
        reject(error);
      }

    });
    localStorage.setItem("crawl_data", JSON.stringify(value));
    return JSON.stringify(value);
  } catch (error) {
    console.log(error)
  }
}

scrape();
