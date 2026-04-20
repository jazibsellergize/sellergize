const offersGrid = document.querySelector(".offers-grid");

const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    console.log("Change Detected");

    if (mutation.type === "childList") {
      console.log("Added : ", mutation.addedNodes.length);
    }
  });
});

observer.observe(offersGrid, {
  childList: true,
  subtree: false,
});

function addNewOffer() {
  const newCard = document.createElement("div");
  newCard.className = "offer-card";

  newCard.innerHTML = `
    <img src="https://via.placeholder.com/300" />
    <div class="offer-content">
      <h3>Flash Sale ⚡</h3>
      <p>Limited time offer just added!</p>
      <p class="validity">Valid till: Tomorrow</p>
      <div class="code">FLASH</div>
    </div>
  `;

  offersGrid.appendChild(newCard);
}
addNewOffer();
