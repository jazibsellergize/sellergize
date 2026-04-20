// Select the main element using ID and access its shadow DOM
let m = document.querySelector('#cms-webcomponent-home-man-web').shadowRoot;

// Select all elements with class 'slot' inside shadow DOM
let items = m.querySelectorAll('.slot');

// Create empty array to store data
let arr = [];

// Loop through each item
items.forEach((a) => {

    // Find <img> inside each slot and get its 'src' attribute
    // ?. is optional chaining (prevents error if img is not found)
    let img = a.querySelector('img')?.getAttribute('src');

    // Create object to store image URL
    let r = {
        image: img
    };

    // Push object into array
    arr.push(r);
});

// Print final array in console
console.log(arr);