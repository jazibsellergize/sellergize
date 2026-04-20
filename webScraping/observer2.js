const offerGrid = document.querySelector(".offers-grid");

const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    console.log("Change Detected");

    if (mutation.type === "attributes") {
      console.log("Attribute Changed");

      console.log("Attribute:", mutation.attributeName);

      const newValue = mutation.target.getAttribute(mutation.attributeName);
      console.log("New Value:", newValue);

      console.log("Old Value:", mutation.oldValue);
    }
  });
});

observer.observe(offerGrid, {
  attributes: true,
  subtree: true,
  attributeFilter: ["class", "id"],
  attributeOldValue: true,
});
