// third task

// get image src from element 'i'
img = i.document.querySelector('img').getAttribute('src');

// get description text from div
description = i.querySelector("div").innerText;

// get banner image src
document.querySelector(".banner.container img").getAttribute("src");

// get first slide image src
document.querySelectorAll("#slide-container .slide img")[0].getAttribute("src");


// select banner and slides
let slides = document.querySelectorAll(".banner.container , #slide-container .slide");

// array to store image data
let imgData = [];

// loop through each slide/banner
slides.forEach(i => {

    // get image src
    let srcInfo = i.querySelector("img").getAttribute("src");

    // create object
    let row = {
        src: srcInfo
    };

    // push into array
    imgData.push(row);
});