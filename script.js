/* =========================================================
   AURASCENT | script.js
   Plain JavaScript. No frameworks, no libraries, no backend.

   Contents
   1. Bottle illustrations (inline SVG, so images never fail)
   2. DATA: the `perfumes` array (Array + Struct)
   3. Helpers
   4. POINTER / REFERENCE demonstration
   5. BUBBLE SORT (manual, with step log)
   6. LINEAR SEARCH (manual, with step log)
   7. Rendering: catalog, featured, modal, algorithm studio
   8. Event wiring
   ========================================================= */
"use strict";


/* =========================================================
   1. BOTTLE ILLUSTRATIONS
   Each product image is an SVG generated as a data URI, so the
   site works offline and the layout can never break. If any
   image still fails to load, attachImageFallback() swaps in a
   generic bottle.
   ========================================================= */
const BOTTLE_SHAPES = {
  rect:  { body: a => `<rect x="130" y="190" width="140" height="200" rx="10" ${a}/>`,
           liquidTop: 222, neck: { x: 180, y: 162, w: 40, h: 30 }, cap: { x: 168, y: 98, w: 64, h: 66 },
           label: { y: 268, w: 112, h: 62 }, hl: { x: 142, y: 206, h: 150 } },
  tall:  { body: a => `<rect x="155" y="170" width="90" height="220" rx="8" ${a}/>`,
           liquidTop: 205, neck: { x: 186, y: 146, w: 28, h: 26 }, cap: { x: 176, y: 86, w: 48, h: 62 },
           label: { y: 262, w: 80, h: 64 }, hl: { x: 165, y: 186, h: 150 } },
  round: { body: a => `<circle cx="200" cy="300" r="100" ${a}/>`,
           liquidTop: 250, neck: { x: 182, y: 176, w: 36, h: 30 }, cap: { x: 170, y: 110, w: 60, h: 68 },
           label: { y: 272, w: 100, h: 58 }, hl: { x: 118, y: 262, h: 76 } },
  flask: { body: a => `<path d="M152 200 H248 L282 384 Q284 398 270 398 H130 Q116 398 118 384 Z" ${a}/>`,
           liquidTop: 240, neck: { x: 184, y: 172, w: 32, h: 30 }, cap: { x: 172, y: 108, w: 56, h: 66 },
           label: { y: 292, w: 100, h: 58 }, hl: { x: 158, y: 226, h: 130 } },
  cyl:   { body: a => `<rect x="140" y="180" width="120" height="212" rx="28" ${a}/>`,
           liquidTop: 215, neck: { x: 182, y: 152, w: 36, h: 30 }, cap: { x: 170, y: 88, w: 60, h: 66 },
           label: { y: 268, w: 96, h: 62 }, hl: { x: 152, y: 206, h: 150 } }
};

function createBottleImage(options) {
  const o = Object.assign(
    { shape: "rect", liquid: "#C5A46D", cap: "#171717", bg: "#E8DFD0", dark: false, name: "" },
    options
  );
  const s = BOTTLE_SHAPES[o.shape];
  const ink = o.dark ? "#F8F5EF" : "#171717";
  const clipId = "clip-" + o.shape;
  const L = s.label;
  const lx = 200 - L.w / 2;

  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500">',
    o.bg ? `<rect width="400" height="500" fill="${o.bg}"/>` : "",
    '<ellipse cx="200" cy="404" rx="112" ry="8" fill="#000" opacity="0.16"/>',
    `<defs><clipPath id="${clipId}">${s.body("")}</clipPath></defs>`,
    s.body(`fill="${ink}" fill-opacity="0.10"`),
    `<g clip-path="url(#${clipId})"><rect x="90" y="${s.liquidTop}" width="220" height="230" fill="${o.liquid}" opacity="0.88"/></g>`,
    s.body(`fill="none" stroke="${ink}" stroke-opacity="0.5" stroke-width="2"`),
    `<rect x="${s.neck.x}" y="${s.neck.y}" width="${s.neck.w}" height="${s.neck.h}" fill="${ink}" fill-opacity="0.18" stroke="${ink}" stroke-opacity="0.5" stroke-width="2"/>`,
    `<rect x="${s.cap.x}" y="${s.cap.y}" width="${s.cap.w}" height="${s.cap.h}" rx="3" fill="${o.cap}"/>`,
    `<rect x="${s.cap.x}" y="${s.cap.y + s.cap.h - 9}" width="${s.cap.w}" height="3" fill="#C5A46D"/>`,
    `<rect x="${lx}" y="${L.y}" width="${L.w}" height="${L.h}" fill="#F8F5EF"/>`,
    `<text x="200" y="${L.y + 21}" text-anchor="middle" font-family="Georgia, serif" font-size="9" letter-spacing="2.4" fill="#171717">AURASCENT</text>`,
    `<line x1="${lx + 18}" x2="${lx + L.w - 18}" y1="${L.y + 30}" y2="${L.y + 30}" stroke="#C5A46D" stroke-width="1"/>`,
    `<text x="200" y="${L.y + 46}" text-anchor="middle" font-family="Georgia, serif" font-size="7" letter-spacing="0.5" fill="#6B665E">${o.name.toUpperCase()}</text>`,
    `<rect x="${s.hl.x}" y="${s.hl.y}" width="5" height="${s.hl.h}" rx="2.5" fill="#fff" opacity="0.4"/>`,
    "</svg>"
  ].join("");

  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

const FALLBACK_IMAGE = createBottleImage({ shape: "rect", name: "AURASCENT" });

function attachImageFallback(img) {
  img.addEventListener("error", () => {
    img.src = FALLBACK_IMAGE;   // generic bottle keeps the layout intact
  }, { once: true });
}


/* =========================================================
   2. DATA: ARRAY + STRUCT
   ---------------------------------------------------------
   ARRAY
   `perfumes` is a JavaScript array. It is the ONLY source of
   product data: the catalog, featured items, sorting,
   searching and the detail modal all read from it.

   STRUCT
   JavaScript has no `struct` keyword like C/C++. Each element
   below is an object with the same fixed set of properties,
   which represents a struct conceptually:

     id          unique number (like a primary key)
     name        product name, used for sorting and searching
     brand       brand or collection name
     category    scent family (Floral, Woody, Fresh, ...)
     size        bottle size as text
     price       price in rupiah, a NUMBER so it can be compared
     stock       units available (demo data)
     description short text for the detail modal
     image       image source (data URI here, could be a URL)

   Difference from a C/C++ struct:
   - A struct has a fixed memory layout and types declared at
     compile time. A JS object is created at runtime and its
     properties can be added, removed, or change type.
   - Copying a struct copies its values. Assigning a JS object
     copies a REFERENCE (see section 4).
   ========================================================= */
const perfumes = [
  { id: 1, name: "Velvet Rose", brand: "AURASCENT Signature", category: "Floral", size: "50 ml", price: 185000, stock: 12,
    description: "A soft floral fragrance of damask rose, peony, and a hint of white musk. Gentle, romantic, and easy to wear every day.",
    image: createBottleImage({ shape: "rect", liquid: "#C98A8F", cap: "#171717", bg: "#EFE4DC", name: "Velvet Rose" }) },

  { id: 2, name: "Midnight Oud", brand: "AURASCENT Noir", category: "Oriental", size: "50 ml", price: 320000, stock: 8,
    description: "Smoky oud wrapped in saffron and dark amber. A deep evening scent with a long, quiet trail.",
    image: createBottleImage({ shape: "tall", liquid: "#4A2C2A", cap: "#171717", bg: "#D9CFC0", name: "Midnight Oud" }) },

  { id: 3, name: "Citrus Bloom", brand: "AURASCENT Atelier", category: "Citrus", size: "50 ml", price: 165000, stock: 20,
    description: "Bright bergamot and mandarin opening onto orange blossom. Clean, sunny, and made for warm days.",
    image: createBottleImage({ shape: "round", liquid: "#E3C35B", cap: "#C5A46D", bg: "#F0E8D6", name: "Citrus Bloom" }) },

  { id: 4, name: "Amber Noir", brand: "AURASCENT Noir", category: "Oriental", size: "100 ml", price: 410000, stock: 6,
    description: "Resinous amber, black vanilla, and a touch of incense. Warm, dense, and unmistakably evening.",
    image: createBottleImage({ shape: "flask", liquid: "#8A4B1F", cap: "#171717", bg: "#DCCFBB", name: "Amber Noir" }) },

  { id: 5, name: "White Musk", brand: "AURASCENT Signature", category: "Fresh", size: "50 ml", price: 175000, stock: 15,
    description: "Powdery white musk, cotton accord, and soft cedar. A skin-like scent that feels freshly washed.",
    image: createBottleImage({ shape: "cyl", liquid: "#EAE5DB", cap: "#C5A46D", bg: "#E8DFD0", name: "White Musk" }) },

  { id: 6, name: "Ocean Mist", brand: "AURASCENT Atelier", category: "Fresh", size: "100 ml", price: 235000, stock: 14,
    description: "Sea salt, aquatic notes, and driftwood. A cool, airy fragrance with the feel of a coastal morning.",
    image: createBottleImage({ shape: "tall", liquid: "#8FB4BF", cap: "#171717", bg: "#E1E4DF", name: "Ocean Mist" }) },

  { id: 7, name: "Golden Vanilla", brand: "AURASCENT Signature", category: "Gourmand", size: "50 ml", price: 215000, stock: 10,
    description: "Madagascan vanilla, caramelised sugar, and toasted almond. Sweet and comforting without being heavy.",
    image: createBottleImage({ shape: "round", liquid: "#D9B36A", cap: "#171717", bg: "#EFE2CC", name: "Golden Vanilla" }) },

  { id: 8, name: "Santal Woods", brand: "AURASCENT Noir", category: "Woody", size: "100 ml", price: 385000, stock: 7,
    description: "Creamy sandalwood, cedar, and dry vetiver. A calm, grounded scent with a smooth woody finish.",
    image: createBottleImage({ shape: "rect", liquid: "#A27B54", cap: "#171717", bg: "#DFD3C0", name: "Santal Woods" }) },

  { id: 9, name: "Jasmine Veil", brand: "AURASCENT Atelier", category: "Floral", size: "30 ml", price: 145000, stock: 18,
    description: "Night-blooming jasmine under a sheer veil of pear and green tea. Delicate and luminous.",
    image: createBottleImage({ shape: "flask", liquid: "#EDE3C8", cap: "#C5A46D", bg: "#ECE3D6", name: "Jasmine Veil" }) },

  { id: 10, name: "Ruby Elixir", brand: "AURASCENT Signature", category: "Gourmand", size: "50 ml", price: 295000, stock: 9,
    description: "Red berries, dark cherry, and praline resting on a base of tonka bean. Rich, juicy, and bold.",
    image: createBottleImage({ shape: "cyl", liquid: "#9B2B3A", cap: "#171717", bg: "#E4D6CC", name: "Ruby Elixir" }) }
];

/* Featured items are chosen by id, then looked up in the array. */
const FEATURED = [
  { id: 1, label: "Best Seller" },
  { id: 6, label: "New Arrival" },
  { id: 2, label: "Signature Collection" }
];


/* =========================================================
   3. APPLICATION STATE AND HELPERS
   ---------------------------------------------------------
   sortedList     the array the catalog is currently ordered by.
                  It starts as a COPY of `perfumes` (slice), so
                  sorting never changes the original array.
                  This is also the array that Linear Search scans,
                  so the indexes in the search log match what is
                  currently on screen.
   searchResults  null = show sortedList, array = show matches only.
   ========================================================= */
let sortedList = perfumes.slice();
let currentSortLabel = "Recommended";
let searchResults = null;


function formatRupiah(number) {
  return "Rp" + String(number).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function findPerfumeById(id) {
  for (let i = 0; i < perfumes.length; i++) {      // simple linear scan
    if (perfumes[i].id === id) return perfumes[i];
  }
  return null;
}

function namesOf(list) {
  const names = [];
  for (let i = 0; i < list.length; i++) names.push(list[i].name);
  return names;
}

/* Compares two strings without Array.prototype.sort or localeCompare.
   Returns 1 if a comes after b, -1 if before, 0 if equal. */
function compareText(a, b) {
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  if (x > y) return 1;
  if (x < y) return -1;
  return 0;
}

const byId = id => document.getElementById(id);


/* =========================================================
   4. POINTER / REFERENCE DEMONSTRATION
   ---------------------------------------------------------
   JavaScript has NO raw pointers and NO pointer arithmetic.
   Variables holding objects hold a REFERENCE to the object.
   Two variables can therefore refer to the very same perfume.
   This demonstrates the reference concept only. It is not the
   same as C/C++ pointers (no addresses, no *ptr, no ptr++).
   ========================================================= */
function runReferenceDemo() {
  const out = [];

  // A second name for the SAME object, not a copy.
  const selectedPerfume = perfumes[0];
  out.push("const selectedPerfume = perfumes[0];");
  out.push("selectedPerfume === perfumes[0]  ->  " + (selectedPerfume === perfumes[0]));

  // Changing the object through one name is visible through the other.
  const originalStock = selectedPerfume.stock;
  selectedPerfume.stock = originalStock - 1;
  out.push("");
  out.push("selectedPerfume.stock = " + originalStock + " - 1;");
  out.push("perfumes[0].stock  ->  " + perfumes[0].stock + "   (changed too, same object)");
  selectedPerfume.stock = originalStock;                 // restore demo data
  out.push("Stock restored to " + perfumes[0].stock + ".");

  // A real copy is a different object, so identity comparison fails.
  const copy = Object.assign({}, perfumes[0]);
  out.push("");
  out.push("const copy = Object.assign({}, perfumes[0]);");
  out.push("copy === perfumes[0]  ->  " + (copy === perfumes[0]) + "   (new object)");

  // sortedList is a different ARRAY but holds the same OBJECT references.
  let sameObjects = true;
  for (let i = 0; i < sortedList.length; i++) {
    if (perfumes.indexOf(sortedList[i]) === -1) sameObjects = false;
  }
  out.push("");
  out.push("sortedList === perfumes  ->  " + (sortedList === perfumes) + "   (separate array)");
  out.push("Every sortedList element is an object from perfumes  ->  " + sameObjects);

  // The cart holds REFERENCES to objects of `perfumes` (not copies)
  out.push("");
  if (cart.length > 0) {
    out.push("cart[0].product === perfumes[" + perfumes.indexOf(cart[0].product) + "]  ->  " +
             (cart[0].product === perfumes[perfumes.indexOf(cart[0].product)]) + "   (cart item refers to the catalog object)");
  } else {
    out.push("Add a product to the cart, then run this demo again to compare cart[0].product with perfumes[i].");
  }

  const text = out.join("\n");
  const box = byId("demoOutput");
  if (box) box.textContent = text;
  console.log(text);
}


/* =========================================================
   5. BUBBLE SORT (manual implementation)
   ---------------------------------------------------------
   Idea: repeatedly walk through the array and compare each
   pair of neighbours. If the pair is in the wrong order, swap
   them. After pass i, the i-th "extreme" element has bubbled to
   its final place at the end, so the next pass can be shorter.
   If a whole pass makes no swap, the array is already sorted
   and the algorithm stops early.

   Array.prototype.sort() is NOT used anywhere.
   ========================================================= */
const SORT_OPTIONS = {
  "price-asc": {
    label: "Price: lowest to highest",
    describe: p => `${p.name} (${formatRupiah(p.price)})`,
    needsSwap: (a, b) => a.price > b.price,
    explain: (a, b, swap) => swap
      ? `${a.name} lebih mahal daripada ${b.name}, belum sesuai urutan termurah. Terjadi pertukaran.`
      : `${a.name} lebih murah atau sama dengan ${b.name}, urutan dipertahankan.`
  },
  "price-desc": {
    label: "Price: highest to lowest",
    describe: p => `${p.name} (${formatRupiah(p.price)})`,
    needsSwap: (a, b) => a.price < b.price,
    explain: (a, b, swap) => swap
      ? `${a.name} lebih murah daripada ${b.name}, belum sesuai urutan termahal. Terjadi pertukaran.`
      : `${a.name} lebih mahal atau sama dengan ${b.name}, urutan dipertahankan.`
  },
  "name-asc": {
    label: "Name: A to Z",
    describe: p => p.name,
    needsSwap: (a, b) => compareText(a.name, b.name) > 0,
    explain: (a, b, swap) => swap
      ? `${a.name} berada setelah ${b.name} secara alfabet. Terjadi pertukaran.`
      : `${a.name} berada sebelum ${b.name} secara alfabet, urutan dipertahankan.`
  }
};

/* Returns { sorted, steps, comparisons, swaps, passes, valid }.
   `source` is never modified; the work happens on a copy. */
function bubbleSort(source, key) {
  const option = SORT_OPTIONS[key];
  const arr = source.slice();                 // copy, so original data stays untouched
  const n = arr.length;
  const steps = [];
  let comparisons = 0, swaps = 0, passes = 0;

  const record = (kind, text, result, active) => steps.push({
    kind, text, result: result || "", active: active || [],
    names: namesOf(arr), cmp: comparisons, swp: swaps, pass: passes
  });

  record("info", `Memulai Bubble Sort (${option.label}) pada ${n} produk.`);

  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    passes++;
    record("pass", `Iterasi ${i + 1}: memeriksa pasangan pada indeks 0 sampai ${n - i - 1}.`);

    for (let j = 0; j < n - i - 1; j++) {
      const a = arr[j];
      const b = arr[j + 1];
      comparisons++;
      const doSwap = option.needsSwap(a, b);

      if (doSwap) {                            // swap neighbours
        arr[j] = b;
        arr[j + 1] = a;
        swaps++;
        swapped = true;
      }
      record(
        doSwap ? "swap" : "keep",
        `Iterasi ${i + 1}, perbandingan ${j + 1}: membandingkan ${option.describe(a)} dengan ${option.describe(b)}.`,
        option.explain(a, b, doSwap),
        [j, j + 1]
      );
    }

    if (!swapped) {
      record("info", `Iterasi ${i + 1} selesai tanpa pertukaran. Data sudah terurut, proses dihentikan lebih awal.`);
      break;
    }
  }

  // Verification: every neighbouring pair must now be in the right order.
  let valid = true;
  for (let k = 0; k < n - 1; k++) {
    if (option.needsSwap(arr[k], arr[k + 1])) valid = false;
  }
  record("done", valid
    ? "Sorting selesai. Katalog berhasil diurutkan dan hasilnya sudah diverifikasi."
    : "Sorting selesai, tetapi verifikasi menemukan urutan yang belum benar.");

  return { sorted: arr, steps, comparisons, swaps, passes, valid, option };
}


/* =========================================================
   6. LINEAR SEARCH (manual implementation)
   ---------------------------------------------------------
   Idea: check the elements one by one from index 0 to the last
   index. Each product name is compared to the keyword, ignoring
   upper/lower case. A partial match counts (the keyword only has
   to appear inside the name). The scan continues to the end so
   that every product matching a partial keyword is found.

   The array scanned is `sortedList`, the array that is currently
   displayed, so the indexes in the log match the catalog order.
   ========================================================= */
function linearSearch(source, rawKeyword, sourceLabel) {
  const keyword = rawKeyword.trim();
  const needle = keyword.toLowerCase();
  const matches = [];
  const matchedIndexes = [];
  const names = namesOf(source);
  const steps = [];
  let checked = 0;

  const record = (kind, text, active) => steps.push({
    kind, text, active: active || [], matched: matchedIndexes.slice(),
    names, checked, found: matches.length
  });

  record("info", `Mencari "${keyword}" pada ${source.length} produk. Sumber array: ${sourceLabel}.`);

  for (let i = 0; i < source.length; i++) {
    checked++;
    const name = source[i].name;
    const isMatch = name.toLowerCase().indexOf(needle) !== -1;   // partial, case-insensitive

    if (isMatch) {
      matches.push(source[i]);
      matchedIndexes.push(i);
    }
    record(isMatch ? "match" : "miss", `Indeks ${i}: ${name} - ${isMatch ? "cocok" : "tidak cocok"}.`, [i]);
  }

  record("done", matches.length > 0
    ? `Pencarian selesai. ${matches.length} produk ditemukan setelah memeriksa ${checked} elemen.`
    : `Pencarian selesai. Produk tidak ditemukan setelah memeriksa ${checked} elemen.`);

  return { matches, steps, checked, keyword };
}


/* =========================================================
   7. RENDERING
   ========================================================= */

/* ----- Catalog and featured cards ----- */
function createCard(p, tagText) {
  const card = document.createElement("article");
  card.className = tagText ? "card feature" : "card";
  card.innerHTML = `
    <div class="card-media">
      <img src="${p.image}" alt="Perfume bottle: ${p.name}" loading="lazy">
      ${tagText ? `<span class="feature-tag">${tagText}</span>` : ""}
    </div>
    <div class="card-body">
      <p class="card-brand">${p.brand}</p>
      <h3 class="card-name">${p.name}</h3>
      <p class="card-meta">${p.category}, ${p.size}</p>
      <p class="card-price">${formatRupiah(p.price)}</p>
      <div class="card-actions">
        <button type="button" class="btn btn-outline" data-id="${p.id}">View Details</button>
        <button type="button" class="btn btn-solid" data-add="${p.id}" ${p.stock === 0 ? "disabled" : ""}>${p.stock === 0 ? "Sold out" : "Add to Cart"}</button>
      </div>
    </div>`;
  attachImageFallback(card.querySelector("img"));
  return card;
}

function renderFeatured() {
  const grid = byId("featuredGrid");
  grid.innerHTML = "";
  FEATURED.forEach(item => {
    const p = findPerfumeById(item.id);
    if (p) grid.appendChild(createCard(p, item.label));
  });
}

function renderCatalog(list, keyword) {
  const grid = byId("catalogGrid");
  grid.innerHTML = "";

  if (list.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    const title = document.createElement("h3");
    title.textContent = "No fragrance found";
    const text = document.createElement("p");
    text.textContent = `Nothing in the collection matches "${keyword}" yet. Try another name, or just part of one, such as "rose" or "oud".`;
    empty.append(title, text);
    grid.appendChild(empty);
  } else {
    const fragment = document.createDocumentFragment();
    list.forEach(p => fragment.appendChild(createCard(p)));
    grid.appendChild(fragment);
  }

  // restart the short fade so the person sees the catalog update
  grid.classList.remove("refresh");
  void grid.offsetWidth;
  grid.classList.add("refresh");

  const status = searchResults === null
    ? `Showing all ${list.length} fragrances. Order: ${currentSortLabel}.`
    : `Showing ${list.length} of ${sortedList.length} fragrances for "${keyword}".`;
  byId("catalogStatus").textContent = status;
}

function refreshCatalogView() {
  if (searchResults === null) renderCatalog(sortedList);
  else renderCatalog(searchResults, byId("searchInput").value.trim());
}

/* ----- Product detail modal ----- */
let lastFocusedElement = null;

function openModal(id) {
  const p = findPerfumeById(id);
  if (!p) return;
  lastFocusedElement = document.activeElement;

  const img = byId("modalImage");
  img.src = p.image;
  img.alt = `Perfume bottle: ${p.name}`;
  attachImageFallback(img);
  byId("modalCategory").textContent = `${p.category} fragrance, ${p.brand}`;
  byId("modalTitle").textContent = p.name;
  byId("modalDescription").textContent = p.description;
  byId("modalSize").textContent = p.size;
  byId("modalPrice").textContent = formatRupiah(p.price);
  byId("modalStock").textContent = `${p.stock} in stock`;
  const addBtn = byId("modalAdd");
  addBtn.dataset.id = p.id;
  addBtn.disabled = p.stock === 0;
  addBtn.textContent = p.stock === 0 ? "Sold out" : "Add to Cart";

  byId("modal").hidden = false;
  document.body.classList.add("modal-open");
  byId("modalClose").focus();
}

function closeModal() {
  byId("modal").hidden = true;
  document.body.classList.remove("modal-open");
  if (lastFocusedElement) lastFocusedElement.focus();
}

/* =========================================================
   CART: an ARRAY of STRUCT-like objects holding REFERENCES
   ---------------------------------------------------------
   cart            array of cart items
   cart item       { product, qty }  (struct representation)
   item.product    a REFERENCE to the object inside `perfumes`.
                   It is not a copy, so item.product === perfumes[i].
                   Changing item.product.stock at checkout therefore
                   updates the catalog object directly (pointer idea).
   orders          array of finished orders (struct-like objects)
   ========================================================= */
let cart = [];
const orders = [];
const CART_KEY = "aurascent-cart";
const SHIPPING = {
  regular: { label: "Regular (3-5 days)", cost: 15000 },
  express: { label: "Express (1-2 days)", cost: 30000 }
};

function findCartItem(product) {
  for (let i = 0; i < cart.length; i++) {
    if (cart[i].product === product) return cart[i];   // reference comparison
  }
  return null;
}

function cartCount() {
  let total = 0;
  for (let i = 0; i < cart.length; i++) total += cart[i].qty;
  return total;
}

function cartSubtotal() {
  let total = 0;
  for (let i = 0; i < cart.length; i++) total += cart[i].product.price * cart[i].qty;
  return total;
}

function saveCart() {
  try {
    const plain = cart.map(item => ({ id: item.product.id, qty: item.qty }));
    localStorage.setItem(CART_KEY, JSON.stringify(plain));
  } catch (e) { /* storage unavailable: the cart still works in memory */ }
}

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    saved.forEach(entry => {
      const product = findPerfumeById(entry.id);      // rebuild the reference
      const qty = product ? Math.min(entry.qty, product.stock) : 0;
      if (qty > 0) cart.push({ product, qty });
    });
  } catch (e) { cart = []; }
}

let toastTimer = null;
function showToast(message) {
  const toast = byId("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function addToCart(id) {
  const product = findPerfumeById(id);
  if (!product) return;
  const item = findCartItem(product);
  const inCart = item ? item.qty : 0;
  if (inCart + 1 > product.stock) {
    showToast(`Only ${product.stock} of ${product.name} available.`);
    return;
  }
  if (item) item.qty++;
  else cart.push({ product: product, qty: 1 });
  saveCart();
  renderCart();
  showToast(`${product.name} added to cart.`);
}

function removeFromCart(id) {
  const product = findPerfumeById(id);
  for (let i = 0; i < cart.length; i++) {
    if (cart[i].product === product) { cart.splice(i, 1); break; }
  }
  saveCart();
  renderCart();
}

function changeQty(id, delta) {
  const product = findPerfumeById(id);
  const item = findCartItem(product);
  if (!item) return;
  const next = item.qty + delta;
  if (next < 1) { removeFromCart(id); return; }
  if (next > product.stock) { showToast(`Only ${product.stock} of ${product.name} available.`); return; }
  item.qty = next;
  saveCart();
  renderCart();
}

function renderCart() {
  const list = byId("cartItems");
  list.innerHTML = "";
  cart.forEach(item => {
    const p = item.product;
    const li = document.createElement("li");
    li.className = "cart-item";
    li.innerHTML = `
      <img src="${p.image}" alt="">
      <div>
        <p class="cart-name">${p.name}</p>
        <p class="cart-meta">${p.size}, ${formatRupiah(p.price)}</p>
        <div class="qty">
          <button type="button" data-qty="-1" data-id="${p.id}" aria-label="Decrease quantity of ${p.name}">-</button>
          <span>${item.qty}</span>
          <button type="button" data-qty="1" data-id="${p.id}" aria-label="Increase quantity of ${p.name}">+</button>
        </div>
      </div>
      <div class="cart-side">
        <p class="cart-line">${formatRupiah(p.price * item.qty)}</p>
        <button type="button" class="link-btn" data-remove="${p.id}">Remove</button>
      </div>`;
    attachImageFallback(li.querySelector("img"));
    list.appendChild(li);
  });

  const count = cartCount();
  byId("cartEmpty").hidden = cart.length > 0;
  byId("checkoutBtn").disabled = cart.length === 0;
  byId("cartSubtotal").textContent = formatRupiah(cartSubtotal());
  const badge = byId("cartCount");
  badge.textContent = count;
  badge.hidden = count === 0;
}

/* ----- Overlays (cart drawer and checkout) ----- */
let lastFocus = null;
function openOverlay(el, focusEl) {
  lastFocus = document.activeElement;
  el.hidden = false;
  document.body.classList.add("modal-open");
  if (focusEl) focusEl.focus();
}
function closeOverlay(el) {
  el.hidden = true;
  document.body.classList.remove("modal-open");
  if (lastFocus && lastFocus.focus) lastFocus.focus();
}
const openDrawer = () => openOverlay(byId("cartDrawer"), byId("cartClose"));
const closeDrawer = () => closeOverlay(byId("cartDrawer"));
const closeCheckout = () => closeOverlay(byId("checkout"));

/* =========================================================
   CHECKOUT: customer data, validation, and the order struct
   ========================================================= */
const FIELD_RULES = {
  name:    v => v.length < 3 ? "Please enter your full name." : "",
  phone:   v => /^(\+62|62|0)8[0-9]{8,11}$/.test(v.replace(/[\s-]/g, "")) ? "" : "Enter a valid mobile number, for example 081234567890.",
  email:   v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "" : "Enter a valid email address.",
  address: v => v.length < 10 ? "Please enter a complete street address." : "",
  city:    v => v.length < 2 ? "Please enter your city." : "",
  postal:  v => /^[0-9]{5}$/.test(v) ? "" : "Postal code must be 5 digits."
};

function selectedShipping() {
  const key = document.querySelector('input[name="shipping"]:checked').value;
  return { key, label: SHIPPING[key].label, cost: SHIPPING[key].cost };
}

function renderSummary() {
  const list = byId("summaryItems");
  list.innerHTML = "";
  cart.forEach(item => {
    const li = document.createElement("li");
    const left = document.createElement("span");
    left.textContent = `${item.product.name} x ${item.qty}`;
    const right = document.createElement("span");
    right.textContent = formatRupiah(item.product.price * item.qty);
    li.append(left, right);
    list.appendChild(li);
  });
  const shipping = selectedShipping().cost;
  byId("sumSubtotal").textContent = formatRupiah(cartSubtotal());
  byId("sumShipping").textContent = formatRupiah(shipping);
  byId("sumTotal").textContent = formatRupiah(cartSubtotal() + shipping);
}

function openCheckout() {
  if (cart.length === 0) return;
  closeDrawer();
  const form = byId("checkoutForm");
  form.reset();
  form.querySelectorAll(".field-error").forEach(el => { el.textContent = ""; });
  form.querySelectorAll("[aria-invalid]").forEach(el => el.removeAttribute("aria-invalid"));
  byId("checkoutError").textContent = "";
  form.hidden = false;
  byId("checkoutSummary").hidden = false;
  byId("orderSuccess").hidden = true;
  renderSummary();
  openOverlay(byId("checkout"), form.elements.namedItem("name"));
}

function placeOrder(event) {
  event.preventDefault();
  const form = byId("checkoutForm");
  const customer = {};
  let firstInvalid = null;

  // validate every customer field
  Object.keys(FIELD_RULES).forEach(key => {
    const input = form.elements.namedItem(key);
    customer[key] = input.value.trim();
    const message = FIELD_RULES[key](customer[key]);
    form.querySelector(`[data-error="${key}"]`).textContent = message;
    if (message) {
      input.setAttribute("aria-invalid", "true");
      if (!firstInvalid) firstInvalid = input;
    } else {
      input.removeAttribute("aria-invalid");
    }
  });
  if (firstInvalid) { firstInvalid.focus(); return; }
  customer.notes = form.elements.namedItem("notes").value.trim();

  // make sure the stock is still enough
  for (let i = 0; i < cart.length; i++) {
    if (cart[i].qty > cart[i].product.stock) {
      byId("checkoutError").textContent = `${cart[i].product.name} only has ${cart[i].product.stock} left. Please update your cart.`;
      return;
    }
  }

  const shipping = selectedShipping();
  const subtotal = cartSubtotal();

  // the ORDER struct
  const order = {
    id: "AUR-" + new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-" + (1000 + Math.floor(Math.random() * 9000)),
    date: new Date().toLocaleString("id-ID"),
    customer: customer,
    shipping: { method: shipping.label, cost: shipping.cost },
    payment: form.elements.namedItem("payment").value,
    items: cart.map(item => ({
      id: item.product.id, name: item.product.name, size: item.product.size,
      qty: item.qty, price: item.product.price, subtotal: item.product.price * item.qty
    })),
    subtotal: subtotal,
    total: subtotal + shipping.cost
  };

  // reduce stock THROUGH THE REFERENCE: the object in `perfumes` is updated
  cart.forEach(item => { item.product.stock -= item.qty; });

  orders.push(order);
  console.log("Order placed:", order);

  cart = [];
  saveCart();
  renderCart();
  renderFeatured();
  refreshCatalogView();
  showSuccess(order);
}

function showSuccess(order) {
  byId("successName").textContent = order.customer.name;
  byId("successId").textContent = order.id;
  byId("successDate").textContent = order.date;
  byId("successTotal").textContent = formatRupiah(order.total);
  byId("successShipping").textContent = `${order.shipping.method}, ${formatRupiah(order.shipping.cost)}`;
  byId("successPayment").textContent = order.payment;
  byId("successAddress").textContent = `${order.customer.address}, ${order.customer.city} ${order.customer.postal}`;
  byId("successContact").textContent = `${order.customer.phone}, ${order.customer.email}`;

  const list = byId("successItems");
  list.innerHTML = "";
  order.items.forEach(item => {
    const li = document.createElement("li");
    const left = document.createElement("span");
    left.textContent = `${item.name} (${item.size}) x ${item.qty}`;
    const right = document.createElement("span");
    right.textContent = formatRupiah(item.subtotal);
    li.append(left, right);
    list.appendChild(li);
  });

  byId("checkoutForm").hidden = true;
  byId("checkoutSummary").hidden = true;
  byId("orderSuccess").hidden = false;
  byId("successDone").focus();
}

/* =========================================================
   ALGORITHM STUDIO (collapsed by default)
   Shows the real step logs produced by bubbleSort and linearSearch.
   ========================================================= */
function openStudio(tab) {
  byId("studio").hidden = false;
  byId("studioToggle").setAttribute("aria-expanded", "true");
  if (tab) setActiveTab(tab);
}
function closeStudio() {
  byId("studio").hidden = true;
  byId("studioToggle").setAttribute("aria-expanded", "false");
}
function setActiveTab(name) {
  document.querySelectorAll(".tab").forEach(tab => tab.setAttribute("aria-selected", String(tab.dataset.tab === name)));
  ["sort", "search", "concepts"].forEach(panel => { byId("panel-" + panel).hidden = panel !== name; });
}

function fillLog(listEl, steps) {
  listEl.innerHTML = "";
  steps.forEach(step => {
    const li = document.createElement("li");
    li.className = "log-" + step.kind;
    li.appendChild(document.createTextNode(step.text));
    if (step.result) {
      const span = document.createElement("span");
      span.className = "log-result";
      span.textContent = step.result;
      li.appendChild(span);
    }
    listEl.appendChild(li);
  });
}

function fillMiniList(listEl, list) {
  listEl.innerHTML = "";
  list.forEach(p => {
    const li = document.createElement("li");
    const name = document.createElement("span");
    name.textContent = p.name;
    const price = document.createElement("span");
    price.className = "price";
    price.textContent = formatRupiah(p.price);
    li.append(name, price);
    listEl.appendChild(li);
  });
}

function showSortReport(report) {
  byId("sortSummary").textContent =
    `Bubble Sort, ${report.option.label}: ${report.comparisons} comparisons, ${report.swaps} swaps, ${report.passes} iterations.`;
  fillMiniList(byId("sortBefore"), perfumes);
  fillMiniList(byId("sortAfter"), report.sorted);
  fillLog(byId("sortLog"), report.steps);
}

function showSearchReport(report) {
  byId("searchSummary").textContent =
    `Linear Search for "${report.keyword}": ${report.matches.length} match(es), ${report.checked} elements checked.`;
  fillLog(byId("searchLog"), report.steps);
}

/* =========================================================
   8. ACTIONS AND EVENT WIRING
   Logs are shown in Algorithm Studio and in the browser console.
   ========================================================= */
function logToConsole(title, steps) {
  console.groupCollapsed(title);
  steps.forEach(step => console.log(step.text + (step.result ? " " + step.result : "")));
  console.groupEnd();
}

function setSearchMessage(text, isError) {
  const el = byId("searchMessage");
  el.textContent = text;
  el.classList.toggle("is-error", Boolean(isError));
}

function applySort() {
  const key = byId("sortSelect").value;

  if (key === "default") {
    sortedList = perfumes.slice();               // original order
    currentSortLabel = "Recommended";
    byId("sortSummary").textContent = "Original order restored. No sorting was applied.";
    byId("sortLog").innerHTML = "";
  } else {
    // take data from `perfumes`, copy it, run Bubble Sort on the copy
    const report = bubbleSort(perfumes, key);
    sortedList = report.sorted;
    currentSortLabel = report.option.label;
    showSortReport(report);
    logToConsole(`Bubble Sort: ${report.option.label} (${report.comparisons} comparisons, ${report.swaps} swaps)`, report.steps);
  }

  searchResults = null;
  byId("searchInput").value = "";
  setSearchMessage("");
  refreshCatalogView();
}

function runSearch() {
  const input = byId("searchInput");
  const keyword = input.value.trim();

  if (keyword === "") {
    setSearchMessage("Please type a perfume name before searching.", true);
    input.focus();
    return;
  }

  // scans the array currently displayed, so log indexes match the catalog order
  const report = linearSearch(sortedList, keyword, `displayed catalog (${currentSortLabel})`);
  searchResults = report.matches;
  showSearchReport(report);
  logToConsole(`Linear Search: "${report.keyword}" (${report.checked} elements checked)`, report.steps);

  setSearchMessage(report.matches.length > 0 ? `${report.matches.length} fragrance(s) found.` : "");
  refreshCatalogView();
}

function resetSearch() {
  byId("searchInput").value = "";
  searchResults = null;
  setSearchMessage("");
  refreshCatalogView();
}

function init() {
  const hero = byId("heroImage");
  hero.src = createBottleImage({ shape: "rect", liquid: "#C5A46D", cap: "#C5A46D", bg: null, dark: true, name: "Signature" });
  attachImageFallback(hero);

  loadCart();
  renderFeatured();
  renderCatalog(sortedList);
  renderCart();

  // Product buttons (event delegation for catalog and featured)
  ["catalogGrid", "featuredGrid"].forEach(id => {
    byId(id).addEventListener("click", event => {
      const details = event.target.closest("button[data-id]");
      const add = event.target.closest("button[data-add]");
      if (details) openModal(Number(details.dataset.id));
      if (add) addToCart(Number(add.dataset.add));
    });
  });

  // Product modal
  byId("modalClose").addEventListener("click", closeModal);
  byId("modal").addEventListener("click", event => { if (event.target.dataset.close) closeModal(); });
  byId("modalAdd").addEventListener("click", () => addToCart(Number(byId("modalAdd").dataset.id)));

  // Cart drawer
  byId("cartBtn").addEventListener("click", openDrawer);
  byId("cartClose").addEventListener("click", closeDrawer);
  byId("cartDrawer").addEventListener("click", event => { if (event.target.dataset.closeDrawer) closeDrawer(); });
  byId("cartItems").addEventListener("click", event => {
    const qtyBtn = event.target.closest("button[data-qty]");
    const removeBtn = event.target.closest("button[data-remove]");
    if (qtyBtn) changeQty(Number(qtyBtn.dataset.id), Number(qtyBtn.dataset.qty));
    if (removeBtn) removeFromCart(Number(removeBtn.dataset.remove));
  });
  byId("checkoutBtn").addEventListener("click", openCheckout);

  // Checkout
  byId("checkoutForm").addEventListener("submit", placeOrder);
  byId("checkoutForm").addEventListener("change", event => {
    if (event.target.name === "shipping") renderSummary();
  });
  byId("checkoutClose").addEventListener("click", closeCheckout);
  byId("checkout").addEventListener("click", event => { if (event.target.dataset.closeCheckout) closeCheckout(); });
  byId("successDone").addEventListener("click", () => {
    closeCheckout();
    byId("collection").scrollIntoView();
  });

  // Escape closes whichever overlay is open
  document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    if (!byId("modal").hidden) closeModal();
    else if (!byId("checkout").hidden) closeCheckout();
    else if (!byId("cartDrawer").hidden) closeDrawer();
  });

  // Sorting applies as soon as an option is chosen
  byId("sortSelect").addEventListener("change", applySort);

  // Searching (Enter key submits the form)
  byId("searchForm").addEventListener("submit", event => { event.preventDefault(); runSearch(); });
  byId("searchReset").addEventListener("click", resetSearch);

  // Algorithm Studio
  byId("studioToggle").addEventListener("click", () => { if (byId("studio").hidden) openStudio(); else closeStudio(); });
  byId("studioClose").addEventListener("click", closeStudio);
  document.querySelectorAll(".tab").forEach(tab => tab.addEventListener("click", () => setActiveTab(tab.dataset.tab)));
  byId("runDemo").addEventListener("click", runReferenceDemo);

  // Navbar search icon jumps to the catalog search field
  byId("navSearchBtn").addEventListener("click", () => {
    byId("collection").scrollIntoView();
    setTimeout(() => byId("searchInput").focus(), 300);
  });

  // Mobile menu
  const header = byId("siteHeader");
  const menuToggle = byId("menuToggle");
  menuToggle.addEventListener("click", () => {
    const open = header.classList.toggle("nav-open");
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });
  byId("mainNav").addEventListener("click", event => {
    if (event.target.tagName === "A") {
      header.classList.remove("nav-open");
      menuToggle.setAttribute("aria-expanded", "false");
    }
  });

  runReferenceDemo();   // also prints the reference demo to the console
}

document.addEventListener("DOMContentLoaded", init);
