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

  console.log(out.join("\n"));
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
      <button type="button" class="btn btn-outline" data-id="${p.id}">View Details</button>
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
   8. ACTIONS AND EVENT WIRING
   The storefront stays clean: the step-by-step algorithm logs
   are written to the browser console (press F12 > Console).
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
    sortedList = perfumes.slice();               // back to the original order
    currentSortLabel = "Recommended";
  } else {
    // take data from `perfumes`, copy it, and run Bubble Sort on the copy
    const report = bubbleSort(perfumes, key);
    sortedList = report.sorted;
    currentSortLabel = report.option.label;
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

  // Linear Search scans the array currently displayed, so log indexes match the catalog order
  const report = linearSearch(sortedList, keyword, `displayed catalog (${currentSortLabel})`);
  searchResults = report.matches;
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

  renderFeatured();
  renderCatalog(sortedList);

  // Product detail buttons (event delegation for catalog and featured)
  ["catalogGrid", "featuredGrid"].forEach(id => {
    byId(id).addEventListener("click", event => {
      const button = event.target.closest("button[data-id]");
      if (button) openModal(Number(button.dataset.id));
    });
  });

  // Modal
  byId("modalClose").addEventListener("click", closeModal);
  byId("modal").addEventListener("click", event => {
    if (event.target.dataset.close) closeModal();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !byId("modal").hidden) closeModal();
  });

  // Sorting applies as soon as an option is chosen
  byId("sortSelect").addEventListener("change", applySort);

  // Searching (Enter key submits the form)
  byId("searchForm").addEventListener("submit", event => {
    event.preventDefault();
    runSearch();
  });
  byId("searchReset").addEventListener("click", resetSearch);

  // Navbar: search icon jumps to the catalog search field
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

  // Reference demo output is available in the console for the course demo
  runReferenceDemo();
}

document.addEventListener("DOMContentLoaded", init);
