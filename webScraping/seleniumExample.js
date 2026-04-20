let titles = document.querySelectorAll(".a-cardui-header");
let titleList = [];
titles.forEach((i) => {
  let title = i.querySelector("h2")?.innerText;
  titleList.push({ title: title });
});
localStorage.setItem("crawl_data", JSON.stringify(titleList));
return JSON.stringify(titleList);