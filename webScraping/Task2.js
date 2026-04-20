// METHOD 1 (Basic extraction)

// select all offer containers
let info1 = document.querySelectorAll(".offers-content");

// variables to store data
let title = "";
let description = "";
let code = "";
let valid = "";

// loop through each offer
info1.forEach(i => {

    // get title
    title = i.querySelector(".Coupons-Content h4").innerText;

    // get description
    description = i.querySelector(".Coupons-Content p").innerText;

    // get code
    code = i.querySelector(".Coupons-display h3").innerText;

    console.log("title: ", title);
    console.log("description: ", description);
    console.log("code: ", code);
});

console.log(title);


// METHOD 2 (Quick extraction)

// select multiple elements
let info2 = document.querySelectorAll(
    ".Coupons-Content h4, .Coupons-Content p, .Coupons-display h3, .valid_date"
);

// print all text
info2.forEach(i => console.log(i.innerText));


// METHOD 3 (Structured data)

// select all offer containers
let info = document.querySelectorAll(".offers-content");

// array to store data
let dataArr = [];

// loop through each offer
info.forEach(i => {

    let title = i.querySelector('h4')?.innerText;
    let description = i.querySelector(".Coupons-Content p")?.innerText;
    let code = i.querySelector(".Coupons-display h3")?.innerText;

    // create object
    let row = {
        title: title,
        description: description,
        code: code
    };

    // push to array
    dataArr.push(row);
});

console.log(dataArr);