const noteText = document.getElementById("note-text");
const charCount = document.getElementById("char-count");
const wordCount = document.getElementById("word-count");
const clearButton = document.getElementById("clear-btn");
const themeToggle = document.getElementById("theme-toggle");

const DRAFT_KEY = "quicknotes-day4-draft";
const THEME_KEY = "quicknotes-day4-theme";
const MAX_CHARACTERS = 200;

function updateCounts() {
  const text = noteText.value;
  const characters = text.length;
  const trimmedText = text.trim();
  const words = trimmedText === "" ? 0 : trimmedText.split(/\s+/).length;

  charCount.textContent = `${characters} / ${MAX_CHARACTERS} characters`;
  wordCount.textContent = `${words} words`;

  charCount.classList.toggle("warning", characters > 180);
  charCount.classList.toggle("over", characters > MAX_CHARACTERS);
}

function saveDraft() {
  localStorage.setItem(DRAFT_KEY, noteText.value);
}

function clearNote() {
  noteText.value = "";
  localStorage.removeItem(DRAFT_KEY);
  updateCounts();
}

function setThemeButtonLabel() {
  themeToggle.textContent = document.body.classList.contains("dark")
    ? "Light mode"
    : "Dark mode";
}

function restoreSavedState() {
  const savedDraft = localStorage.getItem(DRAFT_KEY);
  const savedTheme = localStorage.getItem(THEME_KEY);

  if (savedDraft !== null) {
    noteText.value = savedDraft;
  }

  document.body.classList.toggle("dark", savedTheme === "dark");
  setThemeButtonLabel();
  updateCounts();
}

noteText.addEventListener("input", () => {
  updateCounts();
  saveDraft();
});

clearButton.addEventListener("click", () => {
  clearNote();
  noteText.focus();
});

noteText.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    clearNote();
  }
});

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");

  const isDark = document.body.classList.contains("dark");
  localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
  setThemeButtonLabel();
});

restoreSavedState();
