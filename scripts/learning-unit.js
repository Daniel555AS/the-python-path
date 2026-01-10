// Global variables
let translationsGeneral = {};
let unitData = {};
let currentLanguage = "en";
let currentModule = "";
let currentUnit = "";

// Parse URL hash (module-unit)
function parseHash() {
  const hash = window.location.hash.replace("#", "");
  const parts = hash.split("-");
  // First part is the module, the rest is the unit ID
  currentModule = parts[0];
  currentUnit = parts.slice(1).join("-");
}

// Load general language
async function loadGeneralLanguage(lang) {
  const res = await fetch(`../data/general/general-${lang}.json`);
  translationsGeneral = await res.json();
  applyGeneralTranslations();
}

// Apply menu and footer translations
function applyGeneralTranslations() {
  const menuItems = document.querySelectorAll("#side-menu ul li a");
  const menuKeys = ["home", "roadMap", "trainingArea", "playAndLearn"];

  menuItems.forEach((item, i) => {
    if (translationsGeneral.menu && translationsGeneral.menu[menuKeys[i]]) {
      item.textContent = translationsGeneral.menu[menuKeys[i]];
    }
  });

  // Update footer
  const footerSpan = document.querySelector(
    'footer span[data-i18n="footer.createdBy"]'
  );
  if (footerSpan && translationsGeneral.footer) {
    footerSpan.textContent = translationsGeneral.footer.createdBy;
  }
}

// Load learning unit data
async function loadLearningUnit() {
  try {
    parseHash();
    // Build JSON path using module, unit and language
    const url = `../data/modules/${currentModule}/learning-units/${currentUnit}/${currentUnit}-${currentLanguage}.json`;
    const res = await fetch(url);
    unitData = await res.json();
    renderLearningUnit();
  } catch (err) {
    console.error("Error loading unit:", err);
  }
}

// Render learning unit content
function renderLearningUnit() {
  document.getElementById("unit-title").innerHTML = unitData.title;
  document.getElementById("unit-description").innerHTML = unitData.description;
  const container = document.getElementById("unit-content");
  container.innerHTML = "";

  // Render each content block
  unitData.content.forEach((block) => {
    container.appendChild(buildBlock(block));
  });

  Prism.highlightAll();
}

// Content block builder
function buildBlock(block) {
  const el = document.createElement("div");
  el.classList.add("block", block.type);

  switch (block.type) {
    case "subtitle1":
      el.innerHTML = `<h2>${block.text}</h2>`;
      break;

    case "subtitle2":
      el.innerHTML = `<h3>${block.text}</h3>`;
      break;

    case "paragraph":
      el.innerHTML = `<p>${block.text}</p>`;
      break;

    case "list":
      el.innerHTML = `<ul>${block.items
        .map((i) => `<li>${i}</li>`)
        .join("")}</ul>`;
      break;

    case "code":
      el.innerHTML = `<pre><code class="language-${
        block.language || "python"
      }">${block.text}</code></pre>`;
      break;

    case "note":
      el.innerHTML = `<div class="note">${block.text}</div>`;
      break;

    case "tip":
      el.innerHTML = `<div class="tip">${block.text}</div>`;
      break;

    // Button that opens Training Area with preloaded code
    case "test-button":
      el.innerHTML = `<button class="test-btn">${block.text}</button>`;
      el.querySelector(".test-btn").addEventListener("click", () => {
        const encoded = encodeURIComponent(block.code || "");
        window.open(`../pages/training-area.html?code=${encoded}`, "_blank");
      });
      break;

    case "image":
      el.innerHTML = `
        <div class="image-block">
          <img src="${block.src}">
          ${block.caption ? `<p class="caption">${block.caption}</p>` : ""}
        </div>
      `;
      break;

    case "divider":
      el.innerHTML = `<hr>`;
      break;

    // Collapsible section
    case "collapsible":
      el.innerHTML = `
        <div class="collapsible-header">
          <span>${block.title}</span>
          <span class="arrow">&#9656;</span>
        </div>
        <div class="collapsible-content"></div>
      `;

      const header = el.querySelector(".collapsible-header");
      const content = el.querySelector(".collapsible-content");

      // Render nested blocks
      if (block.content && Array.isArray(block.content)) {
        block.content.forEach((innerBlock) => {
          content.appendChild(buildBlock(innerBlock));
        });
      }

      content.style.display = "none";

      header.addEventListener("click", () => {
        const isOpen = content.style.display === "block";
        content.style.display = isOpen ? "none" : "block";

        header.querySelector(".arrow").style.transform = isOpen
          ? "rotate(0deg)"
          : "rotate(90deg)";
      });

      break;

    // Table block
    case "table":
      el.innerHTML = `
        ${block.title ? `<h3 class="table-title">${block.title}</h3>` : ""}
        <table class="unit-table">
          <thead>
            <tr>${block.headers.map((h) => `<th>${h}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${block.rows
              .map(
                (row) =>
                  `<tr>${row.map((col) => `<td>${col}</td>`).join("")}</tr>`
              )
              .join("")}
          </tbody>
        </table>
      `;
      break;
  }

  return el;
}

// Language handling
async function changeLanguage(lang) {
  currentLanguage = lang;
  localStorage.setItem("selectedLanguage", lang);
  await loadGeneralLanguage(lang);
  await loadLearningUnit();
}

async function loadLanguage(lang) {
  await changeLanguage(lang);
}

// Main events
document.addEventListener("DOMContentLoaded", async () => {
  currentLanguage = localStorage.getItem("selectedLanguage") || "en";
  parseHash();
  await loadGeneralLanguage(currentLanguage);
  await loadLearningUnit();

  // Back button to module roadmap
  const backBtn = document.getElementById("back-btn");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      window.location.href = `../pages/roadmap.html#${currentModule}`;
    });
  }

  // Language selector
  const langOptions = document.querySelectorAll(".language-option");
  langOptions.forEach((option) => {
    option.addEventListener("click", async () => {
      const selectedLang = option.getAttribute("data-lang");
      await changeLanguage(selectedLang);
    });
  });
});

// Reload unit when URL hash changes
window.addEventListener("hashchange", async () => {
  parseHash();
  await loadLearningUnit();
});
