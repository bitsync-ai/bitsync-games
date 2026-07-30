const EPOCH = Date.UTC(2026, 0, 1);
const DAY = 86400000;
const today = new Date();
const utcToday = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
const puzzleNumber = Math.floor((utcToday - EPOCH) / DAY) + 1;
const dayKey = new Date(utcToday).toISOString().slice(0, 10);
const lengths = [4, 6, 8];
const attemptKey = `traceback:attempt:${dayKey}`;

const grid = document.getElementById("grid");
const startButton = document.getElementById("start-button");
const statusText = document.getElementById("status");
const roundText = document.getElementById("round");
const livesText = document.getElementById("lives");
const progress = document.getElementById("progress");
const resultDialog = document.getElementById("result-dialog");
const helpDialog = document.getElementById("help-dialog");
const menuButton = document.getElementById("menu-button");
const menuClose = document.getElementById("menu-close");
const gamesMenu = document.getElementById("games-menu");
const menuBackdrop = document.getElementById("menu-backdrop");

let round = 0;
let lives = 3;
let position = 0;
let accepting = false;
let paths = [];
let roundMarks = [];

function getCookie(name) {
  const prefix = `${name}=`;
  return document.cookie
    .split("; ")
    .find((item) => item.startsWith(prefix))
    ?.slice(prefix.length);
}

function setDailyCookie() {
  const tomorrow = new Date(utcToday + DAY);
  document.cookie = `traceback_day=${dayKey}; expires=${tomorrow.toUTCString()}; path=/; SameSite=Lax`;
}

function saveAttempt(state = "active") {
  localStorage.setItem(attemptKey, JSON.stringify({
    date: dayKey,
    state,
    round,
    lives,
    marks: roundMarks,
  }));
  setDailyCookie();
}

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function buildPaths() {
  const random = seededRandom(puzzleNumber * 7919);
  return lengths.map((length) => {
    const path = [];
    while (path.length < length) {
      const next = Math.floor(random() * 16);
      if (next !== path.at(-1)) path.push(next);
    }
    return path;
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function showPath() {
  accepting = false;
  startButton.hidden = true;
  statusText.textContent = "Watch the signal…";
  progress.style.width = "0";
  await wait(500);
  const path = paths[round];
  for (let index = 0; index < path.length; index += 1) {
    const cell = grid.children[path[index]];
    cell.classList.add("flash");
    progress.style.width = `${((index + 1) / path.length) * 100}%`;
    await wait(460);
    cell.classList.remove("flash");
    await wait(130);
  }
  position = 0;
  progress.style.width = "0";
  statusText.textContent = "Your turn. Trace it back.";
  accepting = true;
}

async function chooseCell(index) {
  if (!accepting) return;
  const expected = paths[round][position];
  const cell = grid.children[index];
  if (index === expected) {
    cell.classList.add("correct");
    setTimeout(() => cell.classList.remove("correct"), 180);
    position += 1;
    progress.style.width = `${(position / paths[round].length) * 100}%`;
    if (position === paths[round].length) {
      accepting = false;
      roundMarks.push("🟩");
      saveAttempt();
      if (round === 2) {
        finish(true);
      } else {
        statusText.textContent = "Path restored.";
        round += 1;
        roundText.textContent = round + 1;
        await wait(850);
        showPath();
      }
    }
  } else {
    accepting = false;
    lives -= 1;
    livesText.textContent = `${"● ".repeat(lives)}${"○ ".repeat(3 - lives)}`.trim();
    livesText.setAttribute("aria-label", `${lives} lives`);
    cell.classList.add("wrong");
    await wait(350);
    cell.classList.remove("wrong");
    if (lives === 0) {
      roundMarks.push("🟥");
      finish(false);
    } else {
      roundMarks.push("🟨");
      saveAttempt();
      statusText.textContent = "Signal lost. Watch again.";
      await wait(700);
      showPath();
    }
  }
}

function loadStats() {
  return JSON.parse(localStorage.getItem("traceback:stats") || '{"played":0,"wins":0,"streak":0,"best":0}');
}

function renderStats(stats = loadStats()) {
  document.getElementById("played").textContent = stats.played;
  document.getElementById("win-rate").textContent = stats.played ? `${Math.round((stats.wins / stats.played) * 100)}%` : "0%";
  document.getElementById("streak").textContent = stats.streak;
  document.getElementById("best").textContent = stats.best;
}

function finish(won) {
  accepting = false;
  saveAttempt("complete");
  const stats = loadStats();
  const previous = localStorage.getItem("traceback:last-played");
  if (previous !== dayKey) {
    stats.played += 1;
    if (won) {
      stats.wins += 1;
      const yesterday = new Date(utcToday - DAY).toISOString().slice(0, 10);
      stats.streak = previous === yesterday ? stats.streak + 1 : 1;
      stats.best = Math.max(stats.best, stats.streak);
    } else {
      stats.streak = 0;
    }
    localStorage.setItem("traceback:stats", JSON.stringify(stats));
    localStorage.setItem("traceback:last-played", dayKey);
    localStorage.setItem("traceback:result", JSON.stringify({ date: dayKey, won, lives, marks: roundMarks }));
  }
  renderStats(stats);
  showResult(won);
}

function showResult(won) {
  document.getElementById("result-title").textContent = won ? "Signal restored." : "Signal lost.";
  document.getElementById("result-copy").textContent = won
    ? `You cleared all three paths with ${lives} ${lives === 1 ? "life" : "lives"} remaining.`
    : "Today’s path got away. A new signal arrives tomorrow.";
  document.getElementById("share-result").textContent =
    `Traceback #${puzzleNumber} ${won ? `${lives}/3` : "X/3"}\n${roundMarks.join("")}\nhttps://bitsync-ai.github.io/bitsync-games/games/traceback/`;
  resultDialog.showModal();
}

function startGame() {
  round = 0;
  lives = 3;
  position = 0;
  roundMarks = [];
  paths = buildPaths();
  saveAttempt();
  roundText.textContent = "1";
  livesText.textContent = "● ● ●";
  showPath();
}

function setMenuOpen(open) {
  gamesMenu.classList.toggle("is-open", open);
  menuBackdrop.classList.toggle("is-open", open);
  gamesMenu.setAttribute("aria-hidden", String(!open));
  gamesMenu.toggleAttribute("inert", !open);
  menuButton.setAttribute("aria-expanded", String(open));
  document.body.classList.toggle("menu-open", open);
  if (open) {
    menuClose.focus();
  } else {
    menuButton.focus();
  }
}

menuButton.addEventListener("click", () => setMenuOpen(true));
menuClose.addEventListener("click", () => setMenuOpen(false));
menuBackdrop.addEventListener("click", () => setMenuOpen(false));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && gamesMenu.classList.contains("is-open")) {
    setMenuOpen(false);
  }
});

for (let index = 0; index < 16; index += 1) {
  const button = document.createElement("button");
  button.className = "cell";
  button.type = "button";
  button.setAttribute("aria-label", `Grid square ${index + 1}`);
  button.addEventListener("click", () => chooseCell(index));
  grid.appendChild(button);
}

document.getElementById("puzzle-number").textContent = `#${String(puzzleNumber).padStart(3, "0")}`;
document.getElementById("help-button").addEventListener("click", () => helpDialog.showModal());
document.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => button.closest("dialog").close()));
document.getElementById("share-button").addEventListener("click", async () => {
  const text = document.getElementById("share-result").textContent;
  if (navigator.share) {
    await navigator.share({ text });
  } else {
    await navigator.clipboard.writeText(text);
    document.getElementById("share-button").textContent = "Copied";
  }
});
const savedDate = localStorage.getItem("traceback:last-played");
const savedResult = JSON.parse(localStorage.getItem("traceback:result") || "null");
const savedAttempt = JSON.parse(localStorage.getItem(attemptKey) || "null");
const cookieLocked = getCookie("traceback_day") === dayKey;

if (savedAttempt?.state === "active") {
  round = savedAttempt.round || 0;
  lives = savedAttempt.lives ?? 0;
  roundMarks = [...(savedAttempt.marks || []), "🟥"];
  lives = 0;
  finish(false);
} else if (savedDate === dayKey && (savedResult?.date ?? savedDate) === dayKey) {
  const result = savedResult;
  roundMarks = result.marks;
  lives = result.lives;
  startButton.textContent = "View today’s result";
  startButton.addEventListener("click", () => showResult(result.won));
} else if (cookieLocked) {
  startButton.textContent = "Played today";
  startButton.disabled = true;
  statusText.textContent = "Today’s attempt was already used on this browser.";
} else {
  startButton.addEventListener("click", startGame);
}
renderStats();
