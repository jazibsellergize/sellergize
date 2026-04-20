const dataArr = [];
const elements_annually = document.querySelectorAll(
  "div[id*='plans-overview-tabpanel']>div",
);
elements_annually.forEach((a) => {
  let title = a.querySelector("div.flex-grow");
  title = title ? title.innerText : "";
  let description = a.querySelector("div.pt-4");
  description = description ? description.innerText.trim() : "";
  let image = a.querySelector("img");
  let image_src = image ? image.src : "";
  let url = a.href;
  if (!url) {
    url = a.querySelector("a");
    url = url ? url.href : "";
  }
  if (!url.startsWith("http") && url != "") {
    url = "https://1password.com/" + url;
  }
  if (!url) {
    url = "https://1password.com/pricing/password-manager";
  }
  let row = {
    store: "1password.com",
    url: url,
    title: title,
    description: description,
    image_url: image_src,
    crawl_type: "text",
    code: "",
    expiry: "",
  };
  dataArr.push(row);
});

const elements_monthly = document.querySelectorAll(
  "div[id*='plans-overview-tabpanel']>div",
);
elements_monthly.forEach((a) => {
  let title = a.querySelector("div.flex-grow");
  title = title ? title.innerText : "";
  let description = a.querySelector("div.pt-4");
  description = description ? description.innerText.trim() : "";
  let image = a.querySelector("img");
  let image_src = image ? image.src : "";
  let url = a.href;
  if (!url) {
    url = a.querySelector("a");
    url = url ? url.href : "";
  }
  if (!url.startsWith("http") && url != "") {
    url = "https://1password.com/" + url;
  }
  if (!url) {
    url = "https://1password.com/pricing/password-manager";
  }
  let row = {
    store: "1password.com",
    url: url,
    title: title,
    description: description,
    image_url: image_src,
    crawl_type: "text",
    code: "",
    expiry: "",
  };
  dataArr.push(row);
});
localStorage.setItem("crawl_data", JSON.stringify(dataArr));
return JSON.stringify(dataArr);
