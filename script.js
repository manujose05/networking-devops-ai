// ============================================================
// TOPIC TRACKING — persisted in localStorage
// ============================================================

const STORAGE_KEY = 'ndai-progress';

function loadProgress() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
}

function saveProgress(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

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
      if (cb.checked) {
        data[topic] = true;
        phaseDone[phase]++;
      } else {
        delete data[topic];
        phaseDone[phase]--;
      }
      saveProgress(data);
      updateStats();
      updateTimestamp();
    });
  });

  updateStats();
}

// ============================================================
// EXPAND / COLLAPSE CARDS
// ============================================================

function initCards() {
  const buttons = document.querySelectorAll('.expand-btn');

  buttons.forEach(btn => {
    const lesson = btn.closest('.lesson');
    const body   = lesson.querySelector('.lesson-body');
    const header = lesson.querySelector('.lesson-header');

    function toggle() {
      const isOpen = lesson.classList.contains('open');
      lesson.classList.toggle('open', !isOpen);
      body.classList.toggle('hidden', isOpen);
    }

    // Stop propagation so the click doesn't also trigger the header listener
    btn.addEventListener('click', e => {
      e.stopPropagation();
      toggle();
    });

    // Clicking anywhere else on the header (not checkbox, not button) also toggles
    header.addEventListener('click', e => {
      if (e.target.closest('.check-label')) return;
      if (e.target.closest('.expand-btn')) return;
      toggle();
    });
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
