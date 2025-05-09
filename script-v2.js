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
  opt.value = ch; opt.textContent = ch;
  chapterSelect.appendChild(opt);
});

document.getElementById("darkModeToggle").onclick = () => document.body.classList.toggle("dark");

// Firebase helpers
const docId = (card)=> `${card.chapter}-${card.front}`.replace(/[^a-zA-Z0-9-_]/g,"_");
const saveCard = (card)=> db.collection("flashcards").doc(docId(card)).set(card);

async function loadCards(){
  const snap = await db.collection("flashcards").get();
  flashcards = snap.docs.map(d=>d.data());
  render();
}

function updateStats(){
  const cur = chapterSelect.value;
  const cards = flashcards.filter(c=>c.chapter===cur);
  const total = cards.length||1;
  const mastered = cards.filter(c=>c.status==="mastered").length;
  const reviewing = cards.filter(c=>c.status==="reviewing").length;
  const unseen = total-mastered-reviewing;
  document.getElementById("mastered-bar").style.width = `${mastered/total*100}%`;
  document.getElementById("reviewing-bar").style.width = `${reviewing/total*100}%`;
  document.getElementById("unseen-bar").style.width = `${unseen/total*100}%`;
}

function render(){
  const cur = chapterSelect.value;
  const container = document.getElementById("flashcards-container");
  container.innerHTML="";
  flashcards.filter(c=>c.chapter===cur).forEach((card,i)=>{
    const div=document.createElement("div");
    div.className="card"; div.textContent=card.front;
    div.onclick=()=>{div.textContent = div.textContent===card.front?card.back:card.front};
    const cb=document.createElement("input");
    cb.type="checkbox"; cb.className="card-checkbox"; cb.dataset.index=i;
    div.prepend(cb);
    container.appendChild(div);
  });
  updateStats();
}

document.getElementById("flashcard-form").onsubmit = async e=>{
  e.preventDefault();
  const front = document.getElementById("front").value.trim();
  const back = document.getElementById("back").value.trim();
  const chapter = chapterSelect.value;
  const card={front,back,chapter,status:"unseen"};
  await saveCard(card);
  flashcards.push(card);
  render();
  e.target.reset();
};

document.getElementById("csv-upload").addEventListener("change",e=>{
  const file=e.target.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload = async (ev) => {
  const raw = ev.target.result.replace(//g, '');
  const lines = raw.split('
').filter(Boolean);
  const chapter = chapterSelect.value;
  let added = 0;

  for (const line of lines) {
    const [front, back] = line.split(',').map(t => t?.trim());
    if (front && back) {
      const card = { front, back, chapter, status: 'unseen' };
      await saveToFirebase(card);
      flashcards.push(card);
      added++;
    }
  }
  render();
  alert(`${added} flashcards imported into ${chapter}`);
  e.target.value = '';
};
  reader.readAsText(file);
});

document.getElementById("select-all").onclick=()=>document.querySelectorAll(".card-checkbox").forEach(cb=>cb.checked=true);

document.getElementById("delete-selected").onclick=async ()=>{
  if(!confirm("Delete selected?")) return;
  const toDelete=[...document.querySelectorAll(".card-checkbox:checked")];
  for(const cb of toDelete){
    const idx=parseInt(cb.dataset.index);
    const card=flashcards[idx];
    await db.collection("flashcards").doc(docId(card)).delete();
  }
  flashcards=flashcards.filter((_,i)=>!toDelete.some(cb=>parseInt(cb.dataset.index)===i));
  render();
};

document.getElementById("start-quiz").onclick=()=>{
  const cards=flashcards.filter(c=>c.chapter===chapterSelect.value);
  if(!cards.length) return alert("No cards.");
  let i=0;
  const ask=()=>{ if(i>=cards.length){render(); return alert("Quiz done.");}
    const card=cards[i];
    prompt(`Q: ${card.front}\n(OK for answer)`);
    const modal=document.createElement("div");
    modal.className="quiz-modal";
    modal.innerHTML=`<p>Answer: ${card.back}</p><p>Did you get it right?</p>`;
    const yes=document.createElement("button"); yes.textContent="✅ Mastered";
    const no=document.createElement("button"); no.textContent="❌ Reviewing";
    yes.onclick=async()=>{card.status="mastered"; await saveCard(card); modal.remove(); i++; ask();};
    no.onclick=async()=>{card.status="reviewing"; await saveCard(card); modal.remove(); i++; ask();};
    modal.appendChild(yes); modal.appendChild(no); document.body.appendChild(modal);
  }; ask();
};

chapterSelect.onchange=()=>{localStorage.setItem("sel_ch",chapterSelect.value); render();};

window.addEventListener("DOMContentLoaded",async ()=>{
  const saved=localStorage.getItem("sel_ch"); if(saved) chapterSelect.value=saved;
  await loadCards();
});
