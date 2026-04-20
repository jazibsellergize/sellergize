
// https://www.pullandbear.com/es/hombre-n6228

let s = document.querySelector("newsletter-banner").shadowRoot
let c = s.querySelectorAll("form");

let titles = [];

c.forEach(i => {

    let title = i.querySelector("h2").innerText;

    let titleObj = {
        title: title
    }

    titles.push(titleObj);

});

console.log(titles);

// https://www.pullandbear.com/es/hombre-n6228

let m = document.querySelector('#cms-webcomponent-home-man-web').shadowRoot
let items = m.querySelectorAll('idt-common-styles-render');
let arr = [];
items.forEach((a) => {
    let img = a.querySelector('img')?.getAttribute('src');
    if (!img) {
        return;
    }
    let r = {
        image: img
    }
    arr.push(r)
});

console.log(arr);
