// Day 3 assignment: Notes Toolkit
// Starting data supplied in the assignment.
let notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];

const validCategories = ["personal", "work", "study"];

// Normalise case and whitespace so duplicates are detected consistently.
function normaliseText(text) {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

// 1. Return notes whose text contains the search word, ignoring case.
function searchNotes(word) {
  const searchTerm = String(word).toLowerCase();
  return notes.filter((note) => note.text.toLowerCase().includes(searchTerm));
}

// 2. Return the note with the most characters, or null when there are no notes.
function longestNote() {
  if (notes.length === 0) {
    return null;
  }

  let longest = notes[0];
  for (const note of notes) {
    if (note.text.length > longest.text.length) {
      longest = note;
    }
  }
  return longest;
}

// 3. Count how many notes belong to each allowed category.
function countByCategory() {
  const counts = { personal: 0, work: 0, study: 0 };

  for (const note of notes) {
    if (Object.prototype.hasOwnProperty.call(counts, note.category)) {
      counts[note.category] += 1;
    }
  }

  return counts;
}

// 4. Return a summary sentence with correct singular/plural wording.
function getSummary() {
  const counts = countByCategory();
  const total = notes.length;
  const noteWord = total === 1 ? "note" : "notes";

  return `${total} ${noteWord}: ${counts.personal} personal, ${counts.work} work, ${counts.study} study.`;
}

// 5. Check for an existing note with matching text, ignoring case/extra spaces.
function isDuplicate(text) {
  if (typeof text !== "string") {
    return false;
  }

  const candidate = normaliseText(text);
  if (candidate.length === 0) {
    return false;
  }

  return notes.some((note) => normaliseText(note.text) === candidate);
}

// 6. Add a note only when its text and category are valid and it is not a duplicate.
function addNote(text, category) {
  if (typeof text !== "string") {
    console.log("Note not added: text must be a string.");
    return false;
  }

  const cleanText = text.trim();
  if (cleanText.length < 1 || cleanText.length > 200) {
    console.log("Note not added: text must contain 1 to 200 characters.");
    return false;
  }

  if (!validCategories.includes(category)) {
    console.log("Note not added: category must be personal, work, or study.");
    return false;
  }

  if (isDuplicate(cleanText)) {
    console.log("Note not added: a note with the same text already exists.");
    return false;
  }

  const nextId = notes.length > 0
    ? Math.max(...notes.map((note) => note.id)) + 1
    : 1;

  notes.push({ id: nextId, text: cleanText, category });
  console.log("Note added successfully.");
  return true;
}

// -------------------- Function tests --------------------
console.log("1. searchNotes tests");
console.log(searchNotes("JAVA")); // Expected: the note with id 4, "Revise JavaScript arrays".
console.log(searchNotes("no matching phrase")); // Expected: [].

console.log("2. longestNote tests");
console.log(longestNote()); // Expected: { id: 3, text: "Email the project report to Grace", category: "work" }.

const notesBeforeEmptyTests = notes;
notes = [];
console.log(longestNote()); // Expected: null when there are no notes.

console.log("3. countByCategory tests");
notes = notesBeforeEmptyTests;
console.log(countByCategory()); // Expected: { personal: 2, work: 1, study: 2 }.
notes = [];
console.log(countByCategory()); // Expected: { personal: 0, work: 0, study: 0 }.

console.log("4. getSummary tests");
notes = notesBeforeEmptyTests;
console.log(getSummary()); // Expected: "5 notes: 2 personal, 1 work, 2 study.".
notes = [notesBeforeEmptyTests[4]];
console.log(getSummary()); // Expected: "1 note: 1 personal, 0 work, 0 study." (singular).
notes = [];
console.log(getSummary()); // Expected: "0 notes: 0 personal, 0 work, 0 study.".

console.log("5. isDuplicate tests");
notes = notesBeforeEmptyTests;
console.log(isDuplicate("  BUY   milk and bread  ")); // Expected: true (case and extra spaces are ignored).
console.log(isDuplicate("Prepare presentation")); // Expected: false (this text is not in the notes).
notes = [];
console.log(isDuplicate("Call mum")); // Expected: false when the notes array is empty.
notes = notesBeforeEmptyTests;

console.log("6. addNote tests");
console.log(addNote("Plan CSS revision", "study")); // Expected: "Note added successfully." then true.
console.log(addNote("  plan   css REVISION ", "study")); // Expected: duplicate-reason message then false.
console.log(addNote("", "personal")); // Expected: length-reason message then false.
console.log(addNote("Prepare slides", "social")); // Expected: category-reason message then false.
console.log(addNote("x".repeat(201), "work")); // Expected: length-reason message then false.
