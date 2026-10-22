// ============================================================
// TOPIC TRACKING — persisted in localStorage
// ============================================================

const STORAGE_KEY    = 'ndai-progress';
const HISTORY_KEY    = 'ndai-history';
const SIDEBAR_KEY    = 'ndai-sidebar';

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

const PHASE_LABELS = { 1: 'Phase 1 · Networking', 2: 'Phase 2 · DevOps', 3: 'Phase 3 · AI' };

function renderHistory() {
  const list = document.getElementById('history-list');
  if (!list) return;
  const history = loadHistory();
  if (history.length === 0) {
    list.innerHTML = '<li class="history-empty">No topics completed yet.<br/>Check a topic above to track it here.</li>';
    return;
  }
  const sorted = [...history].sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
  list.innerHTML = sorted.map(h => {
    const d = new Date(h.completedAt);
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return `<li class="history-item">
      <span class="hi-phase p${h.phase}">${PHASE_LABELS[h.phase] || 'Phase ' + h.phase}</span>
      <span class="hi-title">${h.title}</span>
      <span class="hi-date">${dateStr} · ${timeStr}</span>
    </li>`;
  }).join('');
}

function updateHistoryStats(totalDone, totalAll) {
  const pct = totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0;
  const el = id => document.getElementById(id);
  if (el('hs-done'))  el('hs-done').textContent  = totalDone;
  if (el('hs-total')) el('hs-total').textContent = totalAll;
  if (el('hs-pct'))   el('hs-pct').textContent   = pct + '%';
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
    const pct = phaseTotals[p] > 0 ? Math.round((phaseDone[p] / phaseTotals[p]) * 100) : 0;
    const bar = document.getElementById(`prog-${p}`);
    const label = document.getElementById(`pct-${p}`);
    if (bar)   bar.style.width = pct + '%';
    if (label) label.textContent = pct + '%';
  });

  document.getElementById('stat-done').textContent  = totalDone;
  document.getElementById('stat-total').textContent = totalAll;
  updateHistoryStats(totalDone, totalAll);

  const overallPct = totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0;
  const circumference = 2 * Math.PI * 34;
  const offset = circumference - (overallPct / 100) * circumference;
  const ring = document.getElementById('ring-fill');
  if (ring) {
    ring.style.strokeDashoffset = offset;
    ring.style.stroke = overallPct < 33 ? '#58a6ff' : overallPct < 66 ? '#3fb950' : '#d2a8ff';
  }
  const ringLabel = document.getElementById('ring-label');
  if (ringLabel) ringLabel.textContent = overallPct + '%';
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
      const data    = loadProgress();
      const history = loadHistory();
      const title   = cb.closest('.lesson').querySelector('.lesson-title').textContent;

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
      renderHistory();
      updateTimestamp();
    });
  });

  updateStats();
}

// ============================================================
// EXPAND / COLLAPSE LESSONS  (event delegation)
// ============================================================

function initCards() {
  document.addEventListener('click', function (e) {
    const header = e.target.closest('.lesson-header');
    if (!header) return;
    if (e.target.closest('.check-label')) return;

    const lesson = header.closest('.lesson');
    if (!lesson) return;
    const body = lesson.querySelector('.lesson-body');
    if (!body) return;

    const opening = body.classList.contains('hidden');
    body.classList.toggle('hidden', !opening);
    lesson.classList.toggle('open', opening);
  });
}

// ============================================================
// PHASE COLLAPSE / EXPAND
// ============================================================

function initPhaseToggles() {
  document.querySelectorAll('.phase-header').forEach(header => {
    const section = header.closest('.phase-section');
    const lessons = header.nextElementSibling;
    if (!section || !lessons) return;

    const key = 'phase-collapsed-' + section.id;

    const btn = document.createElement('button');
    btn.className = 'phase-toggle-btn';
    btn.innerHTML = '▼';
    btn.title = 'Collapse / expand phase';
    header.appendChild(btn);

    if (localStorage.getItem(key) === '1') {
      lessons.classList.add('phase-collapsed');
      btn.classList.add('collapsed');
    }

    btn.addEventListener('click', e => {
      e.stopPropagation();
      const isCollapsed = lessons.classList.contains('phase-collapsed');
      lessons.classList.toggle('phase-collapsed', !isCollapsed);
      btn.classList.toggle('collapsed', !isCollapsed);
      localStorage.setItem(key, isCollapsed ? '0' : '1');
    });
  });
}

// ============================================================
// SIDEBAR TOGGLE
// ============================================================

function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const btn     = document.getElementById('sidebar-toggle');
  if (!sidebar || !btn) return;

  if (localStorage.getItem(SIDEBAR_KEY) === 'collapsed') {
    sidebar.classList.add('collapsed');
  }

  btn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    localStorage.setItem(SIDEBAR_KEY,
      sidebar.classList.contains('collapsed') ? 'collapsed' : 'open'
    );
  });
}

// ============================================================
// TIMESTAMP
// ============================================================

function updateTimestamp() {
  const el = document.getElementById('last-updated');
  if (el) el.textContent = new Date().toLocaleDateString('en-US',
    { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function loadTimestamp() {
  const ts = localStorage.getItem('ndai-last-updated');
  const el = document.getElementById('last-updated');
  if (el && ts) el.textContent = ts;
}

function saveTimestamp() {
  const ts = new Date().toLocaleDateString('en-US',
    { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  localStorage.setItem('ndai-last-updated', ts);
  const el = document.getElementById('last-updated');
  if (el) el.textContent = ts;
}

window.updateTimestamp = function() { saveTimestamp(); };

// ============================================================
// BOOT
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  initPhaseToggles();
  initCards();
  initCheckboxes();
  renderHistory();
  loadTimestamp();
});

