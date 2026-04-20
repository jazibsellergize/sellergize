
// https://www.xtool.com/

let s = document.querySelector("mkt-annoucement-topbar").shadowRoot
let c = s.querySelectorAll("span[class*='item__content']");
let offerList = [];

c.forEach(i => {

    let title = i.querySelector("span")?.innerText;

    let offerObj = {
        title: title
    }

    offerList.push(offerObj);

});

console.log(offerList);


// let titles = document.querySelectorAll(".a-cardui-header");
// let titleList = [];

// titles.forEach(i => {

//     let title = i.querySelector("h2")?.innerText;

//     let obj = {

//         title: title

//     }

//     titleList.push(obj);

// });

let titles = document.querySelectorAll(".a-cardui-header");
let titleList = [];

titles.forEach(i => {

    let title = i.querySelector("h2")?.innerText;

    titleList.push({ title: title });
});
return JSON.stringify(titleList);

