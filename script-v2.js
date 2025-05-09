
const loadingIndicator = document.createElement("p");
loadingIndicator.textContent = "Loading flashcards...";
loadingIndicator.style.textAlign = "center";
loadingIndicator.style.marginTop = "20px";
document.getElementById("flashcards-container").appendChild(loadingIndicator);

const chapters = [
  "Chapter 2 & 3 - The Chemical Context of Life & Water and Life",
  "Chapter 4 & 5 - Carbon and Molecular Diversity & Large Molecules",
  "Chapter 6 - A Tour of the Cell",
  "Chapter 7 - Membrane Structure and Function",
  "Chapter 8 - An Introduction to Metabolism",
  "Chapter 9 - Cellular Respiration and Fermentation",
  "Chapter 12 - The Cell Cycle",
  "Chapter 13 - Meiosis",
  "Chapter 14 - Mendel and the Gene Idea",
  "Chapter 15 - The Chromosomal Basis of Inheritance",
  "Chapter 16 - The Molecular Basis of Inheritance",
  "Chapter 17 & 18 - Gene Expression From Gene to Protein"
];

const form = document.getElementById('flashcard-form');
const frontInput = document.getElementById('front');
const backInput = document.getElementById('back');
const chapterSelect = document.getElementById('chapter');
const container = document.getElementById('flashcards-container');
const statsContainer = document.getElementById('stats');
const quizBtn = document.getElementById('start-quiz');
const themeToggle = document.getElementById('theme-toggle');

let flashcards = JSON.parse(localStorage.getItem('flashcards_v2')) || [];

chapters.forEach(chapter => {
  const option = document.createElement('option');
  option.value = chapter;
  option.textContent = chapter;
  chapterSelect.appendChild(option);
});

function getCardsByChapter(chapter) {
  return flashcards.filter(card => card.chapter === chapter);
}

function renderFlashcards() {
  const selectedChapter = chapterSelect.value;
  const cards = getCardsByChapter(selectedChapter);
  container.innerHTML = '';
  let mastered = 0, reviewing = 0;

  cards.forEach((card) => {
    const div = document.createElement('div');
    div.className = 'card';
    div.textContent = card.front;
    div.classList.add(card.status || 'unseen');
    div.onclick = () => {
      div.classList.toggle('flipped');
      div.textContent = div.classList.contains('flipped') ? card.back : card.front;
    };
    if (card.status === "mastered") mastered++;
    if (card.status === "reviewing") reviewing++;
    container.appendChild(div);
  });

  const total = cards.length || 1;
  document.getElementById("mastered-bar").style.width = `${(mastered / total) * 100}%`;
  document.getElementById("reviewing-bar").style.width = `${(reviewing / total) * 100}%`;
  document.getElementById("unseen-bar").style.width = `${((cards.length - mastered - reviewing) / total) * 100}%`;
}

form.onsubmit = (e) => {
  e.preventDefault();
  const card = {
    front: frontInput.value.trim(),
    back: backInput.value.trim(),
    chapter: chapterSelect.value,
    status: "unseen"
  };
  flashcards.push(card);
  localStorage.setItem('flashcards_v2', JSON.stringify(flashcards));
  frontInput.value = '';
  backInput.value = '';
  renderFlashcards();
};


chapterSelect.onchange = () => {
  localStorage.setItem("selected_chapter", chapterSelect.value);
  renderFlashcards();
};


quizBtn.onclick = () => {
  if (document.getElementById('exit-quiz')) return;

  const chapter = chapterSelect.value;
  const cards = shuffle(getCardsByChapter(chapter));
  if (cards.length === 0) {
    alert("No cards available for this chapter.");
    return;
  }

  let index = 0;
  let score = 0;
  let stopQuiz = false;

  function nextCard() {
    if (stopQuiz) return;
    if (index >= cards.length) {
      alert(`Quiz finished! Score: ${score}/${cards.length}`);
      renderFlashcards();
      return;
    }

    const card = cards[index];
    const front = card.front;
    const back = card.back;

    const userAnswer = prompt(`Q: ${front}\n\n(Press OK to see answer)`);
    const confirm = window.confirm(`Answer: ${back}\n\nDid you get it right?`);
    if (confirm) {
      card.status = "mastered";
      score++;
    } else {
      card.status = "reviewing";
    }
    index++;
    localStorage.setItem('flashcards_v2', JSON.stringify(flashcards));
    nextCard();
  }

  nextCard();
};

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

themeToggle.onclick = () => {
  document.body.classList.toggle('dark');
};

renderFlashcards();


document.getElementById("csv-upload").addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (event) {
    const lines = event.target.result.split('\n');
    const chapter = chapterSelect.value;
    lines.forEach(line => {
      const [front, back] = line.split(',').map(s => s?.trim());
      if (front && back) {
        flashcards.push({ front, back, chapter, status: "unseen" });
      }
    });
    localStorage.setItem("flashcards_v2", JSON.stringify(flashcards));
    renderFlashcards();
    alert("Flashcards imported!");
  };
  reader.readAsText(file);
});


document.getElementById("select-all").addEventListener("click", () => {
  const checkboxes = document.querySelectorAll(".flashcard-checkbox");
  checkboxes.forEach(cb => cb.checked = true);
});

document.getElementById("delete-selected").addEventListener("click", () => {
  const confirmed = confirm("Are you sure you want to delete the selected flashcards?");
  if (!confirmed) return;

  const selectedChapter = chapterSelect.value;
  const checkboxes = document.querySelectorAll(".flashcard-checkbox:checked");
  const idsToDelete = Array.from(checkboxes).map(cb => cb.dataset.index);

  flashcards = flashcards.filter((card, index) => {
    return !(card.chapter === selectedChapter && idsToDelete.includes(index.toString()));
  });

  localStorage.setItem("flashcards_v2", JSON.stringify(flashcards));
  renderFlashcards();
});

function renderFlashcards() {
  const selectedChapter = chapterSelect.value;
  const cards = getCardsByChapter(selectedChapter);
  container.innerHTML = '';
  let mastered = 0, reviewing = 0;

  cards.forEach((card, i) => {
    const wrapper = document.createElement('div');
    const div = document.createElement('div');
    div.className = 'card';
    div.textContent = card.front;
    div.classList.add(card.status || 'unseen');
    div.onclick = () => {
      div.classList.toggle('flipped');
      div.textContent = div.classList.contains('flipped') ? card.back : card.front;
    };

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'flashcard-checkbox';
    checkbox.dataset.index = flashcards.indexOf(card);

    wrapper.appendChild(checkbox);
    wrapper.appendChild(div);
    container.appendChild(wrapper);

    if (card.status === "mastered") mastered++;
    if (card.status === "reviewing") reviewing++;
  });

  const total = cards.length || 1;
  document.getElementById("mastered-bar").style.width = `${(mastered / total) * 100}%`;
  document.getElementById("reviewing-bar").style.width = `${(reviewing / total) * 100}%`;
  document.getElementById("unseen-bar").style.width = `${((cards.length - mastered - reviewing) / total) * 100}%`;
}


document.getElementById("csv-upload").addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (event) {
    const lines = event.target.result.split('\n');
    const chapter = chapterSelect.value;
    let addedCount = 0;

    lines.forEach(line => {
      const [front, back] = line.split(',').map(s => s?.trim());
      if (front && back) {
        flashcards.push({ front, back, chapter, status: "unseen" });
        addedCount++;
      }
    });

    if (addedCount > 0) {
      localStorage.setItem("flashcards_v2", JSON.stringify(flashcards));
      renderFlashcards();
      alert(`Imported ${addedCount} flashcards into "${chapter}"`);
    } else {
      alert("No flashcards were imported. Please check your CSV format.");
    }
  };
  reader.readAsText(file);
});


// Create a modal-style quiz UI
function showQuizCard(card, onResult) {
  const modal = document.createElement('div');
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100vw';
  modal.style.height = '100vh';
  modal.style.background = 'rgba(0,0,0,0.6)';
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.zIndex = '1000';

  const box = document.createElement('div');
  box.style.background = 'white';
  box.style.padding = '20px';
  box.style.borderRadius = '12px';
  box.style.maxWidth = '500px';
  box.style.boxShadow = '0 0 12px rgba(0,0,0,0.3)';
  box.innerHTML = `<p><strong>Answer:</strong> ${card.back}</p><p>Did you get it right?</p>`;

  const yesBtn = document.createElement('button');
  yesBtn.textContent = '✅ Yes – Mastered';
  yesBtn.style.marginRight = '10px';
  yesBtn.onclick = () => {
    onResult(true);
    document.body.removeChild(modal);
  };

  const noBtn = document.createElement('button');
  noBtn.textContent = '❌ No – Reviewing';
  noBtn.onclick = () => {
    onResult(false);
    document.body.removeChild(modal);
  };

  box.appendChild(yesBtn);
  box.appendChild(noBtn);
  modal.appendChild(box);
    const exitBtn = document.createElement('button');
  exitBtn.textContent = '🚪 Exit Quiz';
  exitBtn.id = 'exit-quiz';
  exitBtn.style.marginTop = '10px';
  exitBtn.onclick = () => {
    stopQuiz = true;
    document.body.removeChild(modal);
    alert(`Quiz exited early. Score: ${score}/${index}`);
    renderFlashcards();
  };
  box.appendChild(document.createElement('br'));
  box.appendChild(exitBtn);
  document.body.appendChild(modal);
}

quizBtn.onclick = () => {
  if (document.getElementById('exit-quiz')) return;

  const chapter = chapterSelect.value;
  const cards = shuffle(getCardsByChapter(chapter));
  if (cards.length === 0) {
    alert("No cards available for this chapter.");
    return;
  }

  let index = 0;
  let score = 0;
  let stopQuiz = false;

  function nextCard() {
    if (stopQuiz) return;
    if (index >= cards.length) {
      alert(`Quiz finished! Score: ${score}/${cards.length}`);
      renderFlashcards();
      return;
    }

    const card = cards[index];
    const userAnswer = prompt(`Q: ${card.front}\n\n(Press OK to see answer)`);
    showQuizCard(card, (correct) => {
      card.status = correct ? "mastered" : "reviewing";
      if (correct) score++;
      localStorage.setItem("flashcards_v2", JSON.stringify(flashcards));
      index++;
      nextCard();
    });
  }

  nextCard();
};


// Firebase configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, getDocs, setDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBYv_Q4_eRP2_yNo0jd2pq_CSeDxsbUZfE",
  authDomain: "flashcardapp-cc193.firebaseapp.com",
  projectId: "flashcardapp-cc193",
  storageBucket: "flashcardapp-cc193.appspot.com",
  messagingSenderId: "203925836994",
  appId: "1:203925836994:web:5998d5765848c98e2dd75b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function syncFlashcardsToFirebase() {
  const userCards = flashcards || [];
  for (let i = 0; i < userCards.length; i++) {
    const card = userCards[i];
    const id = `${card.chapter}-${card.front}`.replace(/[^a-zA-Z0-9-_]/g, "_");
    await setDoc(doc(db, "flashcards", id), card);
  }
  console.log("Flashcards synced to Firebase.");
}

async function loadFlashcardsFromFirebase() {
  const snapshot = await getDocs(collection(db, "flashcards"));
  const loaded = [];
  snapshot.forEach(doc => loaded.push(doc.data()));
  flashcards = loaded;
  localStorage.setItem("flashcards_v2", JSON.stringify(flashcards));
  console.log("Flashcards loaded from Firebase.");

  const saved = localStorage.getItem("selected_chapter");
  if (saved) {
    chapterSelect.value = saved;
  }
  renderFlashcards();
  if (loadingIndicator) loadingIndicator.remove();
}

document.addEventListener("DOMContentLoaded", loadFlashcardsFromFirebase);
