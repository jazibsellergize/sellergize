
// kmart

let category = document.querySelectorAll(".parent-row.ng-star-inserted");
let categoryList = [];

category.forEach(i => {

    let cat = i.querySelector(".title-col")?.innerText;
    let url = "";

    if (!url.startsWith("https")) {
        url = "https://www.kmart.com/";
    }

    let obj = {
        title: cat,
        url: url
    }
    categoryList.push(obj);
});

console.log(categoryList);
