
let info = document.querySelectorAll(".offers-content");

let dataArr = [];

info.forEach(i => {

    let title = i.querySelector('h4')?.innerText;
    let description = i.querySelector(".Coupons-Content p")?.innerText;
    let code = i.querySelector(".Coupons-display h3")?.innerText;

    let row = {
        title: title,
        description: description,
        code: code
    };

    dataArr.push(row);
});

localStorage.setItem("crawl_data", JSON.stringify(dataArr));
return JSON.stringify(dataArr);