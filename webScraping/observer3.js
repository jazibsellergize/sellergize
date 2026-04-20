const offerGrid = document.querySelector(".offers-grid");
let offerList = [];

// Function to extract data
function extractOffer(card) {
  return {
    img: card.querySelector("img")?.src,
    src: card.querySelector("a")?.href,
    expire: card.querySelector(".promo-expires-at")?.innerText,
    description: card.querySelector(".promo-text-content")?.innerText,
    code: card.querySelector("#promo-code")?.value,
    type: card.querySelector("#promo-code")?.value ? "Code" : "Deal",
  };
}

// Observe changes
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === "childList") {
      mutation.addedNodes.forEach((node) => {
        // Check if node is a promotion card
        if (node.nodeType === 1 && node.matches(".promotion-card")) {
          console.log("New Card Detected");

          const offerObj = extractOffer(node);
          offerList.push(offerObj);

          console.log("Added:", offerObj);
        }
      });
    }
  });
});

// Start observing
observer.observe(offerGrid, {
  childList: true,
  subtree: true,
});

// Initial existing cards
document.querySelectorAll(".promotion-card").forEach((card) => {
  const offerObj = extractOffer(card);
  offerList.push(offerObj);
});

console.log("Initial Data:", offerList);
