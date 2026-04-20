const offerInfo = document.querySelectorAll(".promotion-card");
let offerList = [];

const observer = new IntersectionObserver((entries, obs) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;

    const i = entry.target;

    const imgEl = i.querySelector("img");

    // Handle lazy loading properly
    let img =
      imgEl?.getAttribute("src") ||
      imgEl?.getAttribute("data-src") ||
      imgEl?.dataset?.src;

    let src = i.querySelector("a")?.getAttribute("href");
    let expire = i.querySelector(".promo-expires-at")?.innerText;
    let description = i.querySelector(".promo-text-content")?.innerText;
    let code = i.querySelector("#promo-code")?.value;
    let type = code ? "Code" : "Deal";

    let offerObj = {
      img,
      src,
      expire,
      description,
      code,
      type,
    };

    offerList.push(offerObj);

    console.log("Captured:", offerObj);

    // stop observing this element
    obs.unobserve(i);
  });
});

// Observe all cards
offerInfo.forEach((el) => observer.observe(el));

