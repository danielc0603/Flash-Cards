
// Firebase config and initialization
const firebaseConfig = {
  apiKey: "AIzaSyBYv_Q4_eRP2_yNo0jd2pq_CSeDxsbUZfE",
  authDomain: "flashcardapp-cc193.firebaseapp.com",
  projectId: "flashcardapp-cc193",
  storageBucket: "flashcardapp-cc193.appspot.com",
  messagingSenderId: "203925836994",
  appId: "1:203925836994:web:5998d5765848c98e2dd75b"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let flashcards = [];
const chapters = [
  "Chapter 2 & 3 - The Chemical Context of Life & Water and Life",
  "Chapter 4 & 5 - Carbon and Molecular Diversity & Biological Macromolecules",
  "Chapter 6 - A Tour of the Cell",
  "Chapter 7 - Membrane Structure and Function",
  "Chapter 8 - An Introduction to Metabolism",
  "Chapter 9 - Cellular Respiration and Fermentation",
  "Chapter 12 - The Cell Cycle",
  "Chapter 13 - Meiosis",
  "Chapter 14 - Mendel and the Gene Idea",
  "Chapter 15 - The Chromosomal Basis of Inheritance",
  "Chapter 16 - The Molecular Basis of Inheritance",
  "Chapter 17 & 18 - Gene Expression from Gene to Protein"
];

const chapterSelect = document.getElementById("chapter");
chapters.forEach(ch => {
  const opt = document.createElement("option");
  opt.value = ch;
  opt.textContent = ch;
  chapterSelect.appendChild(opt);
});

document.getElementById("darkModeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

async function syncToFirebase(card) {
  const id = `${card.chapter}-${card.front}`.replace(/[^a-zA-Z0-9-_]/g, "_");
  await db.collection("flashcards").doc(id).set(card);
}

async function loadFromFirebase() {
  const snapshot = await db.collection("flashcards").get();
  flashcards = snapshot.docs.map(doc => doc.data());
}

function updateStats() {
  const current = chapterSelect.value;
  const chapterCards = flashcards.filter(c => c.chapter === current);
  const total = chapterCards.length;
  const mastered = chapterCards.filter(c => c.status === "mastered").length;
  const reviewing = chapterCards.filter(c => c.status === "reviewing").length;
  const unseen = total - mastered - reviewing;

  document.getElementById("mastered-bar").style.width = `${(mastered / total) * 100 || 0}%`;
  document.getElementById("reviewing-bar").style.width = `${(reviewing / total) * 100 || 0}%`;
  document.getElementById("unseen-bar").style.width = `${(unseen / total) * 100 || 0}%`;
}

function renderFlashcards() {
  const container = document.getElementById("flashcards-container");
  container.innerHTML = "";
  const current = chapterSelect.value;
  flashcards.filter(card => card.chapter === current).forEach((card, i) => {
    const div = document.createElement("div");
    div.className = "card";
    div.textContent = card.front;
    div.onclick = () => {
      div.textContent = div.textContent === card.front ? card.back : card.front;
    };
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.classList.add("card-checkbox");
    checkbox.dataset.index = i;
    div.prepend(checkbox);
    container.appendChild(div);
  });
  updateStats();
}

document.getElementById("flashcard-form").addEventListener("submit", async function (e) {
  e.preventDefault();
  const front = document.getElementById("front").value.trim();
  const back = document.getElementById("back").value.trim();
  const chapter = chapterSelect.value;
  const card = { front, back, chapter, status: "unseen" };
  await syncToFirebase(card);
  flashcards.push(card);
  renderFlashcards();
  e.target.reset();
});

document.getElementById("csv-upload").addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async function (event) {
    const lines = event.target.result.split("\n");
    const chapter = chapterSelect.value;
    for (let line of lines) {
      const [front, back] = line.split(",");
      if (front && back) {
        const card = { front: front.trim(), back: back.trim(), chapter, status: "unseen" };
        await syncToFirebase(card);
        flashcards.push(card);
      }
    }
    renderFlashcards();
  };
  reader.readAsText(file);
});

document.getElementById("select-all").addEventListener("click", () => {
  document.querySelectorAll(".card-checkbox").forEach(cb => cb.checked = true);
});

document.getElementById("delete-selected").addEventListener("click", async () => {
  if (!confirm("Are you sure you want to delete selected cards?")) return;
  const checkboxes = document.querySelectorAll(".card-checkbox:checked");
  for (let cb of checkboxes) {
    const index = parseInt(cb.dataset.index);
    const card = flashcards[index];
    const id = `${card.chapter}-${card.front}`.replace(/[^a-zA-Z0-9-_]/g, "_");
    await db.collection("flashcards").doc(id).delete();
  }
  flashcards = flashcards.filter((card, i) => {
    return !checkboxes.some(cb => parseInt(cb.dataset.index) === i);
  });
  renderFlashcards();
});

document.getElementById("start-quiz").addEventListener("click", () => {
  const current = chapterSelect.value;
  const cards = flashcards.filter(c => c.chapter === current);
  if (!cards.length) return alert("No cards in this chapter.");
  let i = 0;
  const ask = () => {
    if (i >= cards.length) return alert("Quiz finished.");
    const card = cards[i];
    prompt(`Q: ${card.front}\n(Press OK to see answer)`);
    const modal = document.createElement("div");
    modal.className = "quiz-modal";
    modal.innerHTML = `<p>Answer: ${card.back}</p><p>Did you get it right?</p>`;
    const yesBtn = document.createElement("button");
    yesBtn.textContent = "✅ Yes - Mastered";
    yesBtn.onclick = async () => {
      card.status = "mastered";
      await syncToFirebase(card);
      modal.remove();
      i++;
      ask();
    };
    const noBtn = document.createElement("button");
    noBtn.textContent = "❌ No - Reviewing";
    noBtn.onclick = async () => {
      card.status = "reviewing";
      await syncToFirebase(card);
      modal.remove();
      i++;
      ask();
    };
    modal.appendChild(yesBtn);
    modal.appendChild(noBtn);
    document.body.appendChild(modal);
  };
  ask();
});

chapterSelect.addEventListener("change", () => {
  localStorage.setItem("selected_chapter", chapterSelect.value);
  renderFlashcards();
});

window.addEventListener("DOMContentLoaded", async () => {
  const saved = localStorage.getItem("selected_chapter");
  if (saved) chapterSelect.value = saved;
  await loadFromFirebase();
  renderFlashcards();
});
