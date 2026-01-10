// Global variables
let translationsGeneral = {};
let translationsPage = {};
let currentLanguage = "en"; // Default language

// Apply translations and render roadmap or module
function applyTranslations() {
  if (!translationsGeneral || !translationsPage) return;

  // Side menu
  const menuItems = document.querySelectorAll("#side-menu ul li a");
  const menuKeys = ["home", "roadMap", "trainingArea", "playAndLearn"];

  menuItems.forEach((item, i) => {
    if (translationsGeneral.menu && translationsGeneral.menu[menuKeys[i]]) {
      item.textContent = translationsGeneral.menu[menuKeys[i]];
    }
  });

  // Footer
  const footerSpan = document.querySelector(
    'footer span[data-i18n="footer.createdBy"]'
  );
  if (footerSpan && translationsGeneral.footer) {
    footerSpan.textContent = translationsGeneral.footer.createdBy;
  }

  // Main content
  const titleEl = document.getElementById("roadmap-title");
  const descEl = document.getElementById("roadmap-description");
  const timeline = document.getElementById("timeline");

  titleEl.textContent = translationsPage.title;
  descEl.textContent = translationsPage.description;
  timeline.innerHTML = ""; // Clear previous timeline items

  // Render each roadmap/module step
  translationsPage.steps.forEach((step, index) => {
    const side = index % 2 === 0 ? "left" : "right";

    const item = document.createElement("div");
    item.classList.add("timeline-item", side);
    item.style.setProperty("--step-color", step.color);

    item.innerHTML = `
      <div class="timeline-content">
        <h3>${step.name}</h3>
        <p>${step.description}</p>
      </div>
    `;

    // Click on roadmap step (module navigation)
    if (step.module) {
      item.classList.add("clickable");
      item.addEventListener("click", () => {
        window.location.hash = step.module;
        loadPage(step.module);
      });
    }

    // Click on module step (learning unit navigation)
    else if (step.unit) {
      item.classList.add("clickable");

      item.addEventListener("click", () => {
        const moduleID = document.body.getAttribute("data-page");
        const unitHash = `${moduleID}-${step.unit}`;

        console.log("moduleID:", moduleID, "unitHash:", unitHash);

        window.location.href = `/pages/learning-unit.html#${unitHash}`;
      });
    }

    timeline.appendChild(item);
  });
}

// Load general language file
async function loadLanguage(lang) {
  try {
    const resGeneral = await fetch(`../data/general/general-${lang}.json`);
    translationsGeneral = await resGeneral.json();
    currentLanguage = lang;

    // Load current page (roadmap or module)
    const currentPage = document.body.getAttribute("data-page") || "roadmap";
    await loadPage(currentPage);
  } catch (err) {
    console.error("Error loading general language:", err);
  }
}

// Load roadmap or module data
async function loadPage(page) {
  try {
    let url;
    // Decide which JSON file to load
    if (page === "roadmap") {
      url = `../data/roadmap/roadmap-${currentLanguage}.json`;
    } else {
      // Module JSON
      url = `../data/modules/${page}/${page}-${currentLanguage}.json`;
    }

    const resPage = await fetch(url);
    translationsPage = await resPage.json();
    document.body.setAttribute("data-page", page);

    // Back button control (modules only)
    const container = document.querySelector(".roadmap-container");

    // Always remove previous back button
    const oldBtn = document.querySelector(".back-btn-wrapper");
    if (oldBtn) oldBtn.remove();

    // If not roadmap, add back button
    if (page !== "roadmap") {
      const wrapper = document.createElement("div");
      wrapper.classList.add("back-btn-wrapper");
      const backBtn = document.createElement("button");
      backBtn.classList.add("back-btn");
      backBtn.textContent = "<";

      backBtn.addEventListener("click", () => {
        window.location.hash = "roadmap";
        loadPage("roadmap");
      });

      wrapper.appendChild(backBtn);
      container.insertBefore(wrapper, container.firstChild);
    }
    // Apply all translations and render UI
    applyTranslations();
  } catch (err) {
    console.error("Error loading page:", err);
  }
}

// Main events
document.addEventListener("DOMContentLoaded", async () => {
  const savedLang = localStorage.getItem("selectedLanguage") || "en";
  await loadLanguage(savedLang);

  // Language change
  const langOptions = document.querySelectorAll(".language-option");
  langOptions.forEach((option) => {
    option.addEventListener("click", async () => {
      const selectedLang = option.getAttribute("data-lang");
      if (selectedLang !== currentLanguage) {
        await loadLanguage(selectedLang);
      }
    });
  });

  // Menu navigation
  const menuLinks = document.querySelectorAll("#side-menu ul li a[data-page]");
  menuLinks.forEach((link) => {
    link.addEventListener("click", async (e) => {
      e.preventDefault();
      const page = link.getAttribute("data-page");
      window.location.hash = page;
      await loadPage(page);
    });
  });

  // Browser back/forward buttons
  window.addEventListener("popstate", async () => {
    const page = window.location.hash.replace("#", "") || "roadmap";
    await loadPage(page);
  });

  //  Load page if URL has a hash
  const hashPage = window.location.hash.replace("#", "");
  if (hashPage) {
    await loadPage(hashPage);
  }
});
