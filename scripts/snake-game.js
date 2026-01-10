let snakeTranslations = {};
let translationsGeneral = {};

// Loads the language JSON files dynamically
async function loadSnakeLang(lang) {
  try {
    // Load GENERAL translations
    const resGeneral = await fetch(`../data/general/general-${lang}.json`);
    if (resGeneral.ok) {
      translationsGeneral = await resGeneral.json();
      applyGeneralTranslationsSnake();
    }

    // Load SNAKE translations
    const resSnake = await fetch(`../data/snake-game/snake-game-${lang}.json`);
    if (resSnake.ok) {
      snakeTranslations = await resSnake.json();
      applySnakeTranslations();
    } else {
      console.warn(`Snake translations not found for lang: ${lang}`);
    }
  } catch (err) {
    console.error("Error loading translations:", err);
  }
}

function applyGeneralTranslationsSnake() {
  if (!translationsGeneral) return;

  // Side menu
  const sideMenu = document.getElementById("side-menu");
  if (sideMenu && translationsGeneral.menu) {
    const menuItems = sideMenu.querySelectorAll("ul li a");
    const menuKeys = ["home", "roadMap", "trainingArea", "playAndLearn"];

    menuItems.forEach((item, i) => {
      if (translationsGeneral.menu[menuKeys[i]]) {
        item.textContent = translationsGeneral.menu[menuKeys[i]];
      }
    });
  }

  // Footer
  const footerSpan = document.querySelector(
    'footer span[data-i18n="footer.createdBy"]'
  );

  if (footerSpan && translationsGeneral.footer) {
    footerSpan.textContent = translationsGeneral.footer.createdBy;
  }
}

// Applies translated text to the DOM
function applySnakeTranslations() {
  const titleEl = document.querySelector("[data-i18n='snake.title']");
  if (titleEl) titleEl.textContent = snakeTranslations.title;

  const scoreLabel = document.querySelector("[data-i18n='snake.score']");
  if (scoreLabel) scoreLabel.textContent = snakeTranslations.score;
}

// Load saved language or default to English
const savedLang = localStorage.getItem("selectedLanguage") || "en";
loadSnakeLang(savedLang);

// Canvas setup
const snakeCanvas = document.getElementById("snake-canvas");
const snakeCtx = snakeCanvas.getContext("2d");

// Grid configuration
const tileSize = 22;
const tilesX = 30;
const tilesY = 20;
snakeCanvas.width = tileSize * tilesX;
snakeCanvas.height = tileSize * tilesY;

// Initial snake body
let snake = [
  { x: 5, y: 5 },
  { x: 4, y: 5 },
  { x: 3, y: 5 },
];

// Game state variables
let direction = "RIGHT";
let nextDirection = "RIGHT";
let food = generateFood();
let specialFood = generateSpecialFood();
let score = 0;
let isGameOver = false;
let isQuestionOpen = false;
let gameInterval = setInterval(gameLoop, 120);

// Keyboard controls
document.addEventListener("keydown", (e) => {
  if (isQuestionOpen) return;

  switch (e.key) {
    case "ArrowUp":
    case "w":
    case "W":
      nextDirection = "UP";
      break;
    case "ArrowDown":
    case "s":
    case "S":
      nextDirection = "DOWN";
      break;
    case "ArrowLeft":
    case "a":
    case "A":
      nextDirection = "LEFT";
      break;
    case "ArrowRight":
    case "d":
    case "D":
      nextDirection = "RIGHT";
      break;
  }
});

// Generates random position for normal food
function generateFood() {
  return {
    x: Math.floor(Math.random() * tilesX),
    y: Math.floor(Math.random() * tilesY),
  };
}

// Generates special food with a low probability
function generateSpecialFood() {
  if (Math.random() < 0.05) {
    return {
      x: Math.floor(Math.random() * tilesX),
      y: Math.floor(Math.random() * tilesY),
    };
  }
  return null;
}

// Moves the snake and handles collisions
function moveSnake() {
  if (nextDirection === "UP" && direction !== "DOWN") direction = "UP";
  if (nextDirection === "DOWN" && direction !== "UP") direction = "DOWN";
  if (nextDirection === "LEFT" && direction !== "RIGHT") direction = "LEFT";
  if (nextDirection === "RIGHT" && direction !== "LEFT") direction = "RIGHT";

  const head = { ...snake[0] };

  // Update head position
  if (direction === "UP") head.y--;
  if (direction === "DOWN") head.y++;
  if (direction === "LEFT") head.x--;
  if (direction === "RIGHT") head.x++;

  // Wall or self collision
  if (head.x < 0 || head.x >= tilesX || head.y < 0 || head.y >= tilesY)
    return gameOver();
  if (snake.some((p) => p.x === head.x && p.y === head.y)) return gameOver();

  snake.unshift(head);

  let ateRed = false;

  // Normal food collision
  if (head.x === food.x && head.y === food.y) {
    score++;
    document.getElementById("score").textContent = score;
    food = generateFood();
    ateRed = true;
  }

  // Special food triggers a quiz question
  if (specialFood && head.x === specialFood.x && head.y === specialFood.y) {
    showRandomQuestion();
    specialFood = null;
  }

  if (!ateRed) snake.pop();
}

// Draws all game elements
function draw() {
  snakeCtx.clearRect(0, 0, snakeCanvas.width, snakeCanvas.height);

  // Normal food
  snakeCtx.fillStyle = "rgba(255, 82, 82, 1)";
  snakeCtx.fillRect(food.x * tileSize, food.y * tileSize, tileSize, tileSize);

  // Special food
  if (specialFood) {
    snakeCtx.fillStyle = "rgba(255, 255, 0, 1)";
    snakeCtx.fillRect(
      specialFood.x * tileSize,
      specialFood.y * tileSize,
      tileSize,
      tileSize
    );
  }

  // Snake
  snakeCtx.fillStyle = "rgba(50, 205, 50, 1)";
  snake.forEach((p) => {
    snakeCtx.fillRect(p.x * tileSize, p.y * tileSize, tileSize, tileSize);
  });
}

// Main game loop
function gameLoop() {
  if (isGameOver) return;
  if (!food) food = generateFood();
  if (!specialFood) specialFood = generateSpecialFood();

  moveSnake();
  draw();
}

// Ends the game and shows the game-over modal
function gameOver() {
  if (isGameOver) return;
  isGameOver = true;

  clearInterval(gameInterval);

  const modal = document.getElementById("game-over-modal");
  modal.classList.add("game-over-visible");

  document.getElementById("game-over-title").textContent =
    snakeTranslations.gameOverTitle;
  document.getElementById(
    "final-score-text"
  ).textContent = `${snakeTranslations.gameOverMessage}: ${score}`;

  const playBtn = document.getElementById("play-again-btn");
  const homeBtn = document.getElementById("go-home-btn");

  playBtn.textContent = snakeTranslations.playAgain;
  homeBtn.textContent = snakeTranslations.goHome;

  playBtn.onclick = () => location.reload();
  homeBtn.onclick = () => (window.location.href = "/index.html");
}

// Loads quiz configuration file
async function loadQuestionConfig() {
  const res = await fetch(`../data/python-questions/config.json`);
  return await res.json();
}

async function loadAllQuestionFiles(lang) {
  const config = await loadQuestionConfig();
  const sets = config.question_sets;
  const basePath = "../data/python-questions/";

  let allQuestions = [];

  for (let i = 1; i <= sets; i++) {
    const start = (i - 1) * 10 + 1;
    const end = i * 10;

    const folder = `questions-${start}-${end}`;
    const filePath = `${basePath}${folder}/${folder}-${lang}.json`;

    try {
      const res = await fetch(filePath);
      if (!res.ok) continue;

      const data = await res.json();
      if (data.questions) {
        allQuestions.push(...data.questions);
      }
    } catch (err) {
      console.warn("Could not load:", filePath);
    }
  }

  return allQuestions;
}

let CURRENT_QUESTION = null;

// Pauses the game and opens a random quiz question
async function showRandomQuestion() {
  isQuestionOpen = true;
  clearInterval(gameInterval);

  try {
    const questions = await loadAllQuestionFiles(savedLang);

    if (questions.length === 0) {
      console.error("No questions found.");
      closeQuestionModal();
      return;
    }

    const random = questions[Math.floor(Math.random() * questions.length)];
    CURRENT_QUESTION = random;
    renderQuestionModal(random);
  } catch (err) {
    console.error("Error loading Python question:", err);
    isQuestionOpen = false;
    gameInterval = setInterval(gameLoop, 120);
  }
}

// Dynamically renders content blocks from JSON
function buildBlock(block) {
  const el = document.createElement("div");

  switch (block.type) {
    case "subtitle1":
      el.className = "q-subtitle1";
      el.textContent = block.text;
      break;

    case "subtitle2":
      el.className = "q-subtitle2";
      el.textContent = block.text;
      break;

    case "paragraph":
      el.className = "q-paragraph";
      el.textContent = block.text;
      break;

    case "list":
      el.className = "q-list";
      const ul = document.createElement("ul");
      block.items.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        ul.appendChild(li);
      });
      el.appendChild(ul);
      break;

    case "code":
      el.className = "q-code";
      el.innerHTML = `<pre><code>${block.text}</code></pre>`;
      break;

    case "note":
      el.className = "q-note";
      el.textContent = block.text;
      break;

    case "tip":
      el.className = "q-tip";
      el.textContent = block.text;
      break;

    case "image":
      el.className = "q-image";
      const img = document.createElement("img");
      img.src = block.src;
      el.appendChild(img);
      break;

    case "table":
      el.className = "q-table";
      const table = document.createElement("table");
      block.rows.forEach((row) => {
        const tr = document.createElement("tr");
        row.forEach((col) => {
          const td = document.createElement("td");
          td.textContent = col;
          tr.appendChild(td);
        });
        table.appendChild(tr);
      });
      el.appendChild(table);
      break;

    case "collapsible":
      el.className = "q-collapsible";

      const btn = document.createElement("button");
      btn.className = "q-collapsible-btn";
      btn.textContent = block.title;

      const content = document.createElement("div");
      content.className = "q-collapsible-content";

      block.content.forEach((inner) => {
        content.appendChild(buildBlock(inner));
      });

      btn.onclick = () => content.classList.toggle("open");

      el.appendChild(btn);
      el.appendChild(content);
      break;

    case "test-button":
      el.className = "q-test-button";
      const b = document.createElement("button");
      b.textContent = block.text;
      el.appendChild(b);
      break;
  }

  return el;
}

// Renders the question modal and its options
function renderQuestionModal(question) {
  const modal = document.getElementById("python-question-modal");
  modal.classList.add("modal-visible");

  const contentEl = document.getElementById("question-content");
  contentEl.innerHTML = "";

  question.content.forEach((block) => {
    contentEl.appendChild(buildBlock(block));
  });

  const optionsEl = document.getElementById("question-options");
  optionsEl.innerHTML = "";

  if (question.type === "multiple-choice") {
    optionsEl.className = "options-mc";
    const colorClasses = ["opt-a", "opt-b", "opt-c", "opt-d"];

    question.options.forEach((opt, index) => {
      const btn = document.createElement("button");
      btn.className = `opt-mc ${colorClasses[index]}`;
      btn.innerHTML = `<strong>${opt.label}.</strong> ${opt.text}`;
      btn.onclick = () =>
        handleAnswer(opt.correct, `${opt.label}. ${opt.text}`);
      optionsEl.appendChild(btn);
    });
  } else if (question.type === "true-false") {
    optionsEl.className = "options-tf";

    question.options.forEach((opt) => {
      const btn = document.createElement("button");
      btn.textContent = opt.text;
      btn.className = opt.label === "True" ? "tf-true" : "tf-false";
      btn.onclick = () =>
        handleAnswer(opt.correct, {
          label: opt.label,
          text: opt.text,
        });
      optionsEl.appendChild(btn);
    });
  }

  document.getElementById("close-question-btn").onclick = closeQuestionModal;
}

// Displays feedback after answering a question
function handleAnswer(isCorrect, selectedOption) {
  const modal = document.getElementById("answer-result-modal");
  const title = document.getElementById("answer-result-title");
  const text = document.getElementById("answer-result-correct-text");

  if (isCorrect) {
    title.textContent = snakeTranslations.answerCorrectTitle || "Correct";
    text.textContent = snakeTranslations.congratulationsMessage || "Well done!";
    title.style.color = "rgba(76, 175, 80, 1)";
  } else {
    title.textContent = snakeTranslations.answerIncorrectTitle || "Incorrect";

    let correctOption = null;
    if (CURRENT_QUESTION && CURRENT_QUESTION.options) {
      correctOption = CURRENT_QUESTION.options.find((o) => o.correct);
    }

    text.textContent = correctOption
      ? `${snakeTranslations.correctAnswerWas || "The correct answer was"}:\n${
          correctOption.text
        }`
      : "";

    title.style.color = "rgba(229, 57, 53, 1)";
  }

  modal.classList.add("modal-visible");

  document.getElementById("answer-result-btn").onclick = () => {
    modal.classList.remove("modal-visible");
    closeQuestionModal();
  };
}

// Closes the question modal and resumes the game
function closeQuestionModal() {
  const modal = document.getElementById("python-question-modal");
  modal.classList.remove("modal-visible");

  isQuestionOpen = false;
  gameInterval = setInterval(gameLoop, 120);
}
