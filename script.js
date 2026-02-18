/* script.js */
const board = document.getElementById("board");
const timerEl = document.getElementById("timer");
const confetti = document.getElementById("confetti");

/* ✅ 15 images => 30 cartes (2x chaque) */
const pairImages = Array.from({ length: 15 }, (_, i) => `images/PREMJEU${i + 1}.jpg`);

function shuffle(arr){
  const a = [...arr];
  for(let i=a.length-1; i>0; i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ---------- Chrono (démarre au premier clic) ---------- */
let timerStarted = false;
let startTime = 0;
let rafId = null;

function formatTime(ms){
  const totalSec = Math.floor(ms/1000);
  const m = String(Math.floor(totalSec/60)).padStart(2,"0");
  const s = String(totalSec%60).padStart(2,"0");
  return `${m}:${s}`;
}

function tick(){
  timerEl.textContent = formatTime(Date.now() - startTime);
  rafId = requestAnimationFrame(tick);
}

function startTimer(){
  if (timerStarted) return;
  timerStarted = true;
  startTime = Date.now();
  rafId = requestAnimationFrame(tick);
}

function stopTimer(){
  if (!timerStarted) return;
  cancelAnimationFrame(rafId);
  rafId = null;
  timerEl.classList.add("done");
}

/* ---------- FX ---------- */
function spawnSparkles(cardEl){
  const count = 2 + Math.floor(Math.random()*2);
  for(let i=0;i<count;i++){
    const sp = document.createElement("div");
    sp.className = "sparkle";
    sp.style.left = `${45 + Math.random()*10}%`;
    sp.style.top  = `${45 + Math.random()*10}%`;
    sp.style.setProperty("--dx", `${(Math.random()*22 - 11).toFixed(0)}px`);
    sp.style.setProperty("--dy", `${(Math.random()*22 - 11).toFixed(0)}px`);
    cardEl.appendChild(sp);
    setTimeout(()=> sp.remove(), 700);
  }
}

function frenchFlagRain(durationMs = 2800){
  const start = Date.now();
  const interval = setInterval(() => {
    const t = Date.now() - start;
    if (t > durationMs){
      clearInterval(interval);
      return;
    }
    for(let i=0;i<10;i++){
      const f = document.createElement("div");
      f.className = "flag";
      f.textContent = "🇫🇷";
      f.style.left = `${Math.random()*100}vw`;
      f.style.fontSize = `${18 + Math.random()*10}px`;
      f.style.animationDuration = `${2.2 + Math.random()*1.2}s`;
      f.style.animationDelay = `${Math.random()*0.15}s`;
      confetti.appendChild(f);
      setTimeout(()=> f.remove(), 4000);
    }
  }, 140);
}

/* ---------- Jeu ---------- */
let first = null;
let second = null;
let lock = false;
let matchedPairs = 0;
const totalPairs = pairImages.length; // 15

// mismatch : clic n’importe où => ferme, sinon auto 3s
let mismatchTimeoutId = null;
let awaitingDismiss = false;

function clearMismatchTimer(){
  if (mismatchTimeoutId){
    clearTimeout(mismatchTimeoutId);
    mismatchTimeoutId = null;
  }
}

function flipBackMismatch(){
  if (!awaitingDismiss) return;
  clearMismatchTimer();

  if (first) first.classList.remove("flipped");
  if (second) second.classList.remove("flipped");

  first = null;
  second = null;
  awaitingDismiss = false;
  lock = false;
}

// capture: ferme mismatch avant tout autre clic
document.addEventListener("click", (e) => {
  if (!awaitingDismiss) return;
  e.preventDefault();
  e.stopPropagation();
  flipBackMismatch();
}, true);

function buildGame(){
  board.innerHTML = "";
  confetti.innerHTML = "";
  timerEl.textContent = "00:00";
  timerEl.classList.remove("done");
  timerStarted = false;
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;

  first = null;
  second = null;
  lock = false;
  matchedPairs = 0;
  awaitingDismiss = false;
  clearMismatchTimer();

  // ✅ deck = 30 cartes EXACT (2x chaque image)
  const deckKeys = shuffle([...pairImages, ...pairImages]);

  deckKeys.forEach((src) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "card";
    card.dataset.key = src; // clé de paire = src image

    card.innerHTML = `
      <div class="inner">
        <div class="face back"></div>
        <div class="face front">
          <img src="${src}" alt="Carte" loading="lazy" />
        </div>
      </div>
    `;

    card.addEventListener("click", () => onFlip(card));
    board.appendChild(card);
  });
}

function onFlip(card){
  if (awaitingDismiss) return;
  if (lock) return;

  startTimer();

  if (card.classList.contains("flipped") || card.classList.contains("matched")) return;

  card.classList.add("flipped");

  if (!first){
    first = card;
    return;
  }

  second = card;

  const a = first.dataset.key;
  const b = second.dataset.key;

  if (a === b){
    first.classList.add("matched");
    second.classList.add("matched");

    spawnSparkles(first);
    spawnSparkles(second);

    matchedPairs++;
    first = null;
    second = null;

    if (matchedPairs === totalPairs){
      stopTimer();
      frenchFlagRain(2800);
    }
    return;
  }

  // mismatch
  lock = true;
  awaitingDismiss = true;

  clearMismatchTimer();
  mismatchTimeoutId = setTimeout(() => {
    flipBackMismatch();
  }, 3000);
}

buildGame();
