// Objects that store loaded translations
let translationsGeneral = {};
let translationsIndex = {};

// Apply translations to the home page
function applyTranslations() {
  if (!translationsGeneral || !translationsIndex) return;

  // Hero subtitle
  document.querySelector(".hero-subtitle").textContent =
    translationsIndex.welcome;

  // Hero initial message
  const initialMsgEl = document.querySelector(".hero-initial-message");
  if (initialMsgEl && translationsIndex.initialMessage) {
    initialMsgEl.textContent = translationsIndex.initialMessage;
  }

  // Hero button text
  const heroBtn = document.querySelector(".hero-button");
  if (heroBtn && translationsIndex.button) {
    heroBtn.textContent = translationsIndex.button;
  }

  // Side menu
  const menuItems = sideMenu.querySelectorAll("ul li a");
  const menuKeys = ["home", "roadMap", "trainingArea", "playAndLearn"];
  menuItems.forEach((item, i) => {
    item.textContent = translationsGeneral.menu[menuKeys[i]];
  });

  // Footer
  const footerSpan = document.querySelector(
    'footer span[data-i18n="footer.createdBy"]'
  );
  if (footerSpan && translationsGeneral.footer) {
    footerSpan.textContent = translationsGeneral.footer.createdBy;
  }
}

// Load language files
async function loadLanguage(lang) {
  try {
    const resIndex = await fetch(`data/index/index-${lang}.json`);
    const resGeneral = await fetch(`data/general/general-${lang}.json`);
    translationsIndex = await resIndex.json();
    translationsGeneral = await resGeneral.json();
    applyTranslations();
  } catch (err) {
    console.error("Error loading languag:", err);
  }
}

// Load saved language or default to English
const savedLang = localStorage.getItem("selectedLanguage") || "en";
loadLanguage(savedLang);





