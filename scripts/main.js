// Bubble background animation
// Canvas setup
const canvas = document.getElementById("bubbles");
const ctx = canvas.getContext("2d");
let width = (canvas.width = window.innerWidth);
let height = (canvas.height = window.innerHeight);

// Bubble configuration
const bubbles = [];
const bubbleCount = 80;

for (let i = 0; i < bubbleCount; i++) {
  bubbles.push({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 3 + 1,
    speed: Math.random() * 0.5 + 0.2,
    alpha: Math.random() * 0.5 + 0.2,
    color: `rgba(${Math.floor(Math.random() * 50)}, ${Math.floor(
      Math.random() * 150 + 50
    )}, ${Math.floor(Math.random() * 255)}, 0.5)`,
  });
}

// Main animation loop
function animateBubbles() {
  ctx.clearRect(0, 0, width, height);
  bubbles.forEach((b) => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fillStyle = b.color;
    ctx.fill();
    b.y -= b.speed;
    // Reset bubble position when it leaves the screen
    if (b.y < -b.radius) {
      b.y = height + b.radius;
      b.x = Math.random() * width;
    }
  });
  requestAnimationFrame(animateBubbles);
}

// Start animation
animateBubbles();

window.addEventListener("resize", () => {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
});

// Side menu toggle
const menuBtn = document.getElementById("menu-btn");
const sideMenu = document.getElementById("side-menu");
// Toggle side menu visibility
menuBtn.addEventListener("click", () => {
  sideMenu.classList.toggle("active");
});

// Language selector dropdown
const langDropdown = document.querySelector(".language-dropdown");
const langBtn = langDropdown.querySelector(".language-btn");
const langOptionsContainer = langDropdown.querySelector(".language-options");
const langText = langBtn.querySelector(".lang-text");
const langFlag = langBtn.querySelector(".flag");

// Show/hide language dropdown
langBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  langDropdown.classList.toggle("active");
});

// Handle language change
langOptionsContainer.addEventListener("click", (e) => {
  const option = e.target.closest(".language-option");
  if (!option) return;

  const selectedLang = option.dataset.lang;
  const selectedFlagClass = option.querySelector(".flag").classList[1];
  const selectedText = option.querySelector("span").textContent;

  // Store current language data
  const currentFlagClass = langFlag.classList[1];
  const currentText = langText.textContent;
  const currentLang = currentText.toLowerCase();

  // Update main button with the selected language
  langFlag.className = `flag ${selectedFlagClass}`;
  langText.textContent = selectedText;

  // Remove selected option from dropdown
  option.remove();

  // Add previous language as a new option
  const newOption = document.createElement("div");
  newOption.classList.add("language-option");
  newOption.dataset.lang = currentLang.includes("english")
    ? "en"
    : currentLang.includes("español")
    ? "es"
    : currentLang.includes("deutsch")
    ? "de"
    : "en";
  newOption.innerHTML = `
        <div class="flag ${currentFlagClass}"></div>
        <span>${currentText}</span>
    `;
  langOptionsContainer.appendChild(newOption);
  localStorage.setItem("selectedLanguage", selectedLang);
  loadLanguage(selectedLang);

  // Close dropdown
  langDropdown.classList.remove("active");
});

// Close language menu when clicking outside
document.addEventListener("click", (e) => {
  if (!langDropdown.contains(e.target)) {
    langDropdown.classList.remove("active");
  }
});

// Sync language button on page load
document.addEventListener("DOMContentLoaded", () => {
  const savedLang = localStorage.getItem("selectedLanguage") || "en";
  const langFlag = document.querySelector(".language-btn .flag");
  const langText = document.querySelector(".language-btn .lang-text");
  const langOptionsContainer = document.querySelector(".language-options");

  // Clear previous options (in case of page change)
  langOptionsContainer.innerHTML = "";

  if (savedLang === "es") {
    langFlag.className = "flag es";
    langText.textContent = "Español";
    langOptionsContainer.innerHTML = `
      <div class="language-option" data-lang="en">
        <div class="flag us"></div><span>English</span>
      </div>
      <div class="language-option" data-lang="de">
        <div class="flag de"></div><span>Deutsch</span>
      </div>
    `;
  } else if (savedLang === "de") {
    langFlag.className = "flag de";
    langText.textContent = "Deutsch";
    langOptionsContainer.innerHTML = `
      <div class="language-option" data-lang="en">
        <div class="flag us"></div><span>English</span>
      </div>
      <div class="language-option" data-lang="es">
        <div class="flag es"></div><span>Español</span>
      </div>
    `;
  } else {
    // Default: English
    langFlag.className = "flag us";
    langText.textContent = "English";
    langOptionsContainer.innerHTML = `
      <div class="language-option" data-lang="es">
        <div class="flag es"></div><span>Español</span>
      </div>
      <div class="language-option" data-lang="de">
        <div class="flag de"></div><span>Deutsch</span>
      </div>
    `;
  }
});
