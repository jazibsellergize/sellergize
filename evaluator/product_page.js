const priceRegex = /([\p{Sc}]|Rs\.?|INR|USD|EUR|GBP)?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)/iu;

function getSchemaProduct() {
  const walker = document.createTreeWalker(document, NodeFilter.SHOW_ELEMENT, {
    acceptNode(node) {
      if (node.nodeName === "SCRIPT" && node.type === "application/ld+json") {
        return NodeFilter.FILTER_ACCEPT;
      }
      return NodeFilter.FILTER_SKIP;
    }
  });

  while (walker.nextNode()) {
    try {
      const s = walker.currentNode;
      const data = JSON.parse(s.innerText);
      const arr = Array.isArray(data) ? data : [data];
      for (const d of arr) {
        if (d["@type"] === "Product" || d["@type"] === "ProductGroup") return d;
        if (d["@graph"]) {
          const p = d["@graph"].find(x => x["@type"] === "Product");
          if (p) return p;
        }
      }
    } catch (e) { }
  }
  return null;
}

function isShopifyPDP() {
  return !!document.querySelector('form[action*="/cart/add"], meta[name="shopify-checkout-api-token"]')
    && !document.querySelector('.product-grid, .collection, [data-product-grid]');
}

function isWooPDP() {
  return !!document.querySelector('div.product.type-product, body.single-product, form.cart')
    && !document.querySelector('ul.products');
}

/* ---------------- AMAZON ---------------- */

function isAmazonPDP() {
  return location.hostname.includes("amazon.")
    && document.querySelector("#productTitle")
    && document.querySelector("#buybox, #addToCart_feature_div");
}


function isProductPage() {
  return isShopifyPDP() || isWooPDP() || isAmazonPDP() || getSchemaProduct();
}

function getHeroImage() {
  let img = null;
  let bestTop = Infinity;

  const imgs = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, {
    acceptNode(node) {
      if (node.tagName === "IMG" && isElementVisible(node) && node.naturalWidth >= 250 && node.naturalHeight >= 250) {
        return NodeFilter.FILTER_ACCEPT;
      }
      return NodeFilter.FILTER_SKIP;
    }
  });

  while (imgs.nextNode()) {
    const node = imgs.currentNode;
    const top = node.getBoundingClientRect().top;
    if (top < bestTop) {
      bestTop = top;
      img = node;
    }
  }
  return img;
}

function getImage(schema) {
  if (schema && schema.image) {
    if (Array.isArray(schema.image)) {
      return schema.image[0];
    } else {
      return schema.image;
    }
  }
  const heroImg = getHeroImage();
  if (heroImg) {
    return heroImg.src;
  }
}

function getTitle(schema) {
  if (schema && schema.name) {
    return schema.name;
  }
  let title = document.querySelector("#productTitle")?.innerText;
  if (title) return title;

  const heroImg = getHeroImage();

  let bestH1 = null;
  let bestDistance = Infinity;

  const h1s = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, {
    acceptNode(node) {

      if (node.tagName === "H1" && isElementVisible(node)) {
        return NodeFilter.FILTER_ACCEPT;
      }
      return NodeFilter.FILTER_SKIP;
    }
  });
  const heroTop = heroImg ? heroImg.getBoundingClientRect().top : 0;
  while (h1s.nextNode()) {
    const node = h1s.currentNode;
    const h1Top = node.getBoundingClientRect().top;
    const distance = Math.abs(h1Top - heroTop);


    if (distance < bestDistance) {
      bestDistance = distance;
      bestH1 = node;
    }
  }
  if (bestH1) {
    title = bestH1.innerText;
  }
  return title;

}

function getPrice(schema) {
  let price = null;
  if (schema) {
    if (schema.offers) {
      if (Array.isArray(schema.offers)) {
        price = schema.offers[0].price;
      } else {
        price = schema.offers.price;
      }
    } else if (schema.price) {
      price = schema.price;
    } else if (Array.isArray(schema?.hasVariant?.offers)) {
      price = schema.hasVariant.offers[0].price;
    }
    let currency = schema.offers?.priceCurrency || null;
    if (!currency && Array.isArray(schema?.hasVariant?.offers)) {
      currency = schema.hasVariant.offers[0].priceCurrency || null;
    }
    return { price: price, currency: currency, originalPrice: null };
  }
  const pw = document.querySelector(".a-price-whole")?.innerText;
  const pf = document.querySelector(".a-price-fraction")?.innerText;
  if (pw) price = parseFloat((pw + "." + pf).replace(/,/g, ""));

  const strike = document.querySelector(".a-text-price .a-offscreen")?.innerText;
  if (strike) {
    const m = strike.match(/([\d,.]+)/);
    if (m) originalPrice = parseFloat(m[1].replace(/,/g, ""));
  }

  const cur = document.querySelector(".a-price-symbol")?.innerText;
  if (price) {
    return { price: price, currency: cur || null, originalPrice: originalPrice || null };
  }

  const elements = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode(node) {
        if (
          node.tagName !== "SPAN" &&
          node.tagName !== "DIV" &&
          node.tagName !== "P" &&
          node.tagName !== "DEL" &&
          node.tagName !== "S" &&
          !isElementVisible(node)

        ) {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      }
    });

  let prices = [];
  while (elements.nextNode()) {
    const el = elements.currentNode;
    const t = el.innerText;
    const m = t.match(priceRegex);
    if (m) {
      const st = getComputedStyle(el);
      prices.push({
        value: parseFloat(m[2].replace(/,/g, "")),
        currency: m[1],
        strike: ["DEL", "S"].includes(el.tagName) || st.textDecoration.includes("line-through"),
        font: parseFloat(st.fontSize) || 0,
        el
      });
    }
  }
  if (prices.length > 0) {
    prices.sort((a, b) => b.font - a.font);
    const cur = prices.find(p => !p.strike) || prices[0];
    price = cur.value;
    currency = cur.currency;
    const orig = prices.find(p => p.strike && p.value > cur.value);
    originalPrice = orig?.value || null;
  }
  return { price: price, currency: currency || null, originalPrice: originalPrice || null };
}

function getRating(schema) {
  if (schema && schema.aggregateRating) {
    return schema.aggregateRating.ratingValue;
  }
  const r = document.querySelector("i.a-icon-star span")?.innerText;
  if (r) {
    const m = r.match(/([\d.]+)/);
    if (m) return m[1];
  }

  const elements = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode(node) {
        if (
          node.tagName !== "SPAN" &&
          node.tagName !== "DIV" &&
          node.tagName !== "P" &&
          node.tagName !== "A" &&
          node.tagName !== "I" &&
          !isElementVisible(node)

        ) {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      }
    });
  while (elements.nextNode()) {
    const el = elements.currentNode;
    const text = (el.innerText + " " + (el.getAttribute("aria-label") || "") + " " + (el.title || "")).toLowerCase();
    const m = text.match(/([0-5](?:\.\d)?)\s*(out of\s*5|\/5|stars?)/);
    if (m) return m[1];
  }
  return null;
}

function getReviewCount(schema) {
  if (schema && schema.aggregateRating) {
    return schema.aggregateRating.reviewCount;
  }
  const rc = document.querySelector('[data-hook="total-rating-count"]')?.innerText;
  if (rc) {
    const m = rc.match(/([\d,]+)/);
    if (m) return m[1].replace(/,/g, "");
  }

  const elements = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode(node) {
        if (
          node.tagName !== "SPAN" &&
          node.tagName !== "DIV" &&
          node.tagName !== "P" &&
          node.tagName !== "A" &&
          node.tagName !== "I" &&
          !isElementVisible(node)

        ) {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      }
    });
  while (elements.nextNode()) {
    const el = elements.currentNode;
    const text = (el.innerText + " " + (el.getAttribute("aria-label") || "") + " " + (el.title || "")).toLowerCase();
    const m = text.match(/([\d,]+)\s*(ratings?|reviews?)/);
    if (m) return m[1].replace(/,/g, "");
  }
  return null;
}

function getQuantity() {
  const elements = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode(node) {
        if (
          node.tagName !== "INPUT" &&
          node.tagName !== "SELECT" &&
          !isElementVisible(node)

        ) {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      }
    });
  while (elements.nextNode()) {
    const el = elements.currentNode;
    const attrs = [...el.attributes].map(a => a.value).join(" ").toLowerCase();
    if (/qty|quantity/.test(attrs)) {
      if (el.tagName === "SELECT") {
        const nums = [...el.options].map(o => parseInt(o.value || o.text)).filter(n => !isNaN(n));
        if (nums.length) { return nums[0]; }
      }
      if (el.tagName === "INPUT") {
        const v = parseInt(el.value || el.getAttribute("value"));
        if (!isNaN(v)) { return v; }
      }
    }
  }
  return null;
}

function getEstimatedDelivery() {

  const del = document.querySelector("#mir-layout-DELIVERY_BLOCK span")?.innerText;
  if (del) return del;
  const elements = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode(node) {
        if (
          node.tagName !== "SPAN" &&
          node.tagName !== "DIV" &&
          node.tagName !== "P" &&
          !isElementVisible(node)

        ) {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      }
    });
  while (elements.nextNode()) {
    const el = elements.currentNode;
    const text = el.innerText.toLowerCase();
    if (/delivery|arrives|in\s*\d+\s*days|tomorrow|today|by\s+\w+/.test(text)) {
      const m = text.match(/(in\s*\d+\s*days|tomorrow|today|by\s+\w+\s*\d*)/);
      return m ? m[1] : text;
    }
  }
  return null;
}

function extractProductInfo() {
  let schema = getSchemaProduct();
  let image = getImage(schema);
  let title = getTitle(schema);
  let price = getPrice(schema);
  let rating = getRating(schema);
  let reviewCount = getReviewCount(schema);
  let quantity = getQuantity();
  let estimatedDelivery = getEstimatedDelivery();
  return {
    image: image,
    title: title,
    price: price,
    rating: rating,
    reviewCount: reviewCount,
    quantity: quantity,
    estimatedDelivery: estimatedDelivery,
    url: window.location.href
  };
}