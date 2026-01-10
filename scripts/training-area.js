// Objects that will store the loaded translations
let translationsGeneral = {};
let translationsTrainingArea = {};

document.addEventListener("DOMContentLoaded", async () => {
  // Check if the editor container exists
  const editorContainer = document.getElementById("editor");
  if (!editorContainer) return;

  // Get code passed via URL parameter (?code=...)
  const urlParams = new URLSearchParams(window.location.search);
  const externalCode = urlParams.get("code");

  // Initialize Monaco Editor and Pyodide using the central loader
  await MonacoPyodide.initializeMonacoAndPyodide({
    editorId: "editor",
    outputId: "output",
    runButtonId: "run-btn",
    initialCode: externalCode || `# The Python Path\nprint("Hello World!")`,
    editorOptions: {
      theme: "vs-dark",
      fontSize: 15,
      automaticLayout: true,
      wordWrap: "on",
    },
  });

  const editor = MonacoPyodide.getEditor();
});

// Apply loaded translations to the page
function applyTranslations() {
  if (!translationsGeneral || !translationsTrainingArea) return;

  const titleTrainingArea = document.querySelector("#title-training-area");
  if (titleTrainingArea && translationsTrainingArea.title) {
    titleTrainingArea.textContent = translationsTrainingArea.title;
  }

  // Update side menu items
  const menuItems = sideMenu.querySelectorAll("ul li a");
  const menuKeys = ["home", "roadMap", "trainingArea", "playAndLearn"];
  menuItems.forEach((item, i) => {
    item.textContent = translationsGeneral.menu[menuKeys[i]];
  });

  // Update footer text
  const footerSpan = document.querySelector(
    'footer span[data-i18n="footer.createdBy"]'
  );
  if (footerSpan && translationsGeneral.footer) {
    footerSpan.textContent = translationsGeneral.footer.createdBy;
  }
}

// Load language JSON files
async function loadLanguage(lang) {
  try {
    const resGeneral = await fetch(`../data/general/general-${lang}.json`);
    const resTrainingArea = await fetch(
      `../data/training-area/training-area-${lang}.json`
    );
    translationsGeneral = await resGeneral.json();
    translationsTrainingArea = await resTrainingArea.json();
    applyTranslations();
  } catch (err) {
    console.error("Error loading language:", err);
  }
}

// Load saved language or default to English
const savedLang = localStorage.getItem("selectedLanguage") || "en";
loadLanguage(savedLang);
