// ============================================================
// TOPIC TRACKING — persisted in localStorage
// ============================================================

const STORAGE_KEY    = 'ndai-progress';
const HISTORY_KEY    = 'ndai-history';

function loadProgress() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
}
function saveProgress(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ============================================================
// HISTORY — record when each topic was completed
// ============================================================

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; }
  catch { return []; }
}
function saveHistory(data) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(data));
}

const PHASE_COLORS = { 1: 'p1', 2: 'p2', 3: 'p3' };

// ============================================================
// PHASE COUNTERS
// ============================================================

const phaseTotals = { 1: 0, 2: 0, 3: 0 };
const phaseDone   = { 1: 0, 2: 0, 3: 0 };

function updateStats() {
  let totalDone = 0;
  let totalAll  = 0;

  [1, 2, 3].forEach(p => {
    totalDone += phaseDone[p];
    totalAll  += phaseTotals[p];

    const pct = phaseTotals[p] > 0
      ? Math.round((phaseDone[p] / phaseTotals[p]) * 100)
      : 0;

    const bar = document.getElementById(`prog-${p}`);
    const label = document.getElementById(`pct-${p}`);
    if (bar)   bar.style.width = pct + '%';
    if (label) label.textContent = pct + '%';
  });

  document.getElementById('stat-done').textContent  = totalDone;
  document.getElementById('stat-total').textContent = totalAll;

  // Ring
  const overallPct = totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0;
  const circumference = 2 * Math.PI * 34; // r=34
  const offset = circumference - (overallPct / 100) * circumference;
  const ring = document.getElementById('ring-fill');
  if (ring) ring.style.strokeDashoffset = offset;
  const ringLabel = document.getElementById('ring-label');
  if (ringLabel) ringLabel.textContent = overallPct + '%';

  // Change ring color based on progress
  if (ring) {
    if (overallPct < 33)       ring.style.stroke = '#58a6ff';
    else if (overallPct < 66)  ring.style.stroke = '#3fb950';
    else                       ring.style.stroke = '#d2a8ff';
  }
}

// ============================================================
// CHECKBOXES
// ============================================================

function initCheckboxes() {
  const progress = loadProgress();
  const checks = document.querySelectorAll('.topic-check');

  checks.forEach(cb => {
    const phase = parseInt(cb.dataset.phase, 10);
    const topic = cb.dataset.topic;

    phaseTotals[phase] = (phaseTotals[phase] || 0) + 1;

    if (progress[topic]) {
      cb.checked = true;
      phaseDone[phase] = (phaseDone[phase] || 0) + 1;
    }

    cb.addEventListener('change', () => {
      const data = loadProgress();
      const title = cb.closest('.lesson').querySelector('.lesson-title').textContent;
      const history = loadHistory();

      if (cb.checked) {
        data[topic] = true;
        phaseDone[phase]++;
        if (!history.find(h => h.topic === topic)) {
          history.push({ topic, phase, title, completedAt: new Date().toISOString() });
        }
      } else {
        delete data[topic];
        phaseDone[phase]--;
        const idx = history.findIndex(h => h.topic === topic);
        if (idx !== -1) history.splice(idx, 1);
      }

      saveProgress(data);
      saveHistory(history);
      updateStats();
      updateTimestamp();
    });
  });

  updateStats();
}

// ============================================================
// EXPAND / COLLAPSE LESSONS  (event delegation — single listener)
// ============================================================

function initCards() {
  document.addEventListener('click', function (e) {

    // ── clicked the ▼ button itself ──────────────────────────
    const btn = e.target.closest('.expand-btn');
    if (btn) {
      const lesson = btn.closest('.lesson');
      if (!lesson) return;
      const body = lesson.querySelector('.lesson-body');
      if (!body) return;

      const opening = body.classList.contains('hidden');
      body.classList.toggle('hidden', !opening);
      lesson.classList.toggle('open', opening);
      btn.innerHTML = opening ? '▲' : '▼';
      return;
    }

    // ── clicked anywhere else on the header row ──────────────
    const header = e.target.closest('.lesson-header');
    if (!header) return;
    if (e.target.closest('.check-label')) return;   // let checkbox work normally

    const lesson = header.closest('.lesson');
    if (!lesson) return;
    const body      = lesson.querySelector('.lesson-body');
    const expandBtn = lesson.querySelector('.expand-btn');
    if (!body) return;

    const opening = body.classList.contains('hidden');
    body.classList.toggle('hidden', !opening);
    lesson.classList.toggle('open', opening);
    if (expandBtn) expandBtn.innerHTML = opening ? '▲' : '▼';
  });
}

// ============================================================
// TIMESTAMP
// ============================================================

function updateTimestamp() {
  const el = document.getElementById('last-updated');
  if (el) {
    el.textContent = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
}

function loadTimestamp() {
  const ts = localStorage.getItem('ndai-last-updated');
  const el = document.getElementById('last-updated');
  if (el && ts) el.textContent = ts;
}

function saveTimestamp() {
  const ts = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
  localStorage.setItem('ndai-last-updated', ts);
  const el = document.getElementById('last-updated');
  if (el) el.textContent = ts;
}

// Override updateTimestamp to also save
const _origUpdate = updateTimestamp;
window.updateTimestamp = function() { saveTimestamp(); };

// ============================================================
// BOOT
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  initCards();
  initCheckboxes();
  loadTimestamp();
});
