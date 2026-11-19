'use strict';

const $ = id => document.getElementById(id);
const kinds = { all: 'All trophies', story: 'Story', missable: 'Missable', collectible: 'Collectibles', activity: 'Activities', misc: 'Other' };
const priority = [2, 3, 17, 30, 15, 14];
const order = t => priority.includes(t.id) ? priority.indexOf(t.id) : t.id + 10;
const trophies = [...atlasTrophies].sort((a, b) => order(a) - order(b));
let logbook = readLogbook(trophies);
let selected = 17;
const reveals = new Set();
let kind = 'all';
let view = 'tracker';

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, x => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[x]);
}

function gradeShield(grade) {
  return `<span class="shield ${grade}" title="${grade}"><svg viewBox="0 0 44 44" aria-hidden="true"><path d="M3 9 9 3l8 3 5-2 5 2 8-3 6 6-3 18q-2 9-16 14Q8 36 6 27Z"/><path d="M5 13h34"/></svg><b aria-hidden="true">${grade[0].toUpperCase()}</b><span class="sr">${grade}</span></span>`;
}

function isMasked(t) {
  return logbook.shield && t.kind === 'story' && !logbook.earned.has(t.id) && !reveals.has(t.id);
}

function displayName(t) {
  return isMasked(t) ? 'Story trophy hidden' : t.name;
}

function matchingTrophies() {
  const query = $('search').value.trim().toLowerCase();
  return trophies.filter(t => {
    if (kind !== 'all' && (kind === 'missable' ? !t.missable : t.kind !== kind)) return false;
    if ($('grade').value !== 'all' && t.grade !== $('grade').value) return false;
    if (!$('hidden-toggle').checked && t.hidden) return false;
    if (!$('earned-toggle').checked && logbook.earned.has(t.id)) return false;
    return (isMasked(t) ? displayName(t) : `${t.name} ${t.description}`).toLowerCase().includes(query);
  });
}

function renderProgress() {
  const grades = progressByGrade(trophies, logbook.earned);
  const points = grades.reduce((sum, g) => sum + g.earned * g.points, 0);
  const total = grades.reduce((sum, g) => sum + g.total * g.points, 0);
  $('progress').innerHTML = `<div class="overall"><div><strong>${logbook.earned.size} / ${trophies.length}</strong> earned</div><progress aria-label="Trophies earned" max="${trophies.length}" value="${logbook.earned.size}"></progress></div>
    <dl class="grade-progress">${grades.map(g => `<div>${gradeShield(g.grade)}<div><dt>${g.grade}</dt><dd>${g.earned} / ${g.total} <small>· ${g.earned * g.points} pts</small></dd></div></div>`).join('')}</dl>
    <div class="point-total"><strong>${points} / ${total.toLocaleString('en-US')}</strong><span>PSN points</span></div>`;
}

function checklistRow(t) {
  const masked = isMasked(t);
  const name = escapeHtml(displayName(t));
  return `<li class="trophy-row${selected === t.id ? ' selected' : ''}${masked ? ' masked' : ''}">
    <input type="checkbox" data-earn="${t.id}" aria-label="Mark ${name} earned" ${logbook.earned.has(t.id) ? 'checked' : ''}>
    ${gradeShield(t.grade)}
    <button type="button" data-select="${t.id}" aria-pressed="${selected === t.id}"><strong>${name}</strong><span>${masked ? 'Name and description protected' : escapeHtml(t.description)}</span></button>
    <div class="row-end">${masked ? `<button class="reveal" type="button" data-reveal="${t.id}">Reveal</button>` : `<span class="${t.missable ? 'risk-label' : 'kind-label'}">${t.missable ? 'Possible missable' : kinds[t.kind]}</span>`}</div></li>`;
}

function renderGuide(t) {
  const title = `<h2 class="panel-heading">Field guide ${t ? `<span>Exit 0${t.stage}</span>` : ''}</h2>`;
  if (!t) {
    $('guide').innerHTML = `${title}<p class="guide-body">Pick a trophy to read its guide.</p>`;
    return;
  }
  const units = { 14: '% completion', 17: 'gold medals', 28: 'meditations' };
  const citations = `<h4>Sources</h4><ul class="citations">${t.sources.map(s => `<li><a target="_blank" rel="noopener noreferrer" href="${escapeHtml(s.url)}">${escapeHtml(s.name)}</a></li>`).join('')}</ul>`;
  $('guide').innerHTML = `${title}<div class="guide-body">
    <div class="guide-title">${gradeShield(t.grade)}<div><h3 tabindex="-1">${escapeHtml(displayName(t))}</h3><p>${t.grade} · ${kinds[t.kind]}</p></div></div>
    ${isMasked(t) ? `<p>The spoiler shield hides this trophy until you earn it or reveal it.</p><button type="button" data-reveal="${t.id}">Reveal this trophy</button>` : `
    ${t.missable ? `<p class="guide-warning">${escapeHtml(t.missableReason)}</p>` : ''}
    ${t.missable ? citations : ''}
    <p class="guide-copy">${escapeHtml(t.guide)}</p>
    ${t.missable ? '' : citations}
    ${units[t.id] ? `<p class="guide-target"><strong>${t.count}</strong> ${units[t.id]}</p>` : ''}`}</div>`;
}

function renderTracker() {
  const list = $('trophy-list');
  const active = document.activeElement;
  const field = list.contains(active) && ['earn', 'select', 'reveal'].find(key => active.dataset[key]);
  const results = matchingTrophies();
  const current = results.find(t => t.id === selected) ?? results.find(t => !isMasked(t)) ?? results[0];
  selected = current?.id;
  list.innerHTML = results.map(checklistRow).join('') || '<li class="empty">No matches. Try another grade, kind or search term.</li>';
  $('result-count').textContent = `${results.length} / ${trophies.length} shown`;
  renderGuide(current);
  if (field) {
    const id = active.dataset[field];
    (list.querySelector(`[data-${field}="${id}"]`) ?? list.querySelector(`[data-select="${id}"]`) ?? $('search')).focus({ preventScroll: true });
  }
}

function syncControls() {
  $('spoiler-toggle').checked = logbook.shield;
  $('shield-state').textContent = `Spoiler shield ${logbook.shield ? 'ON' : 'OFF'}`;
  for (const b of $('kinds').children) b.setAttribute('aria-pressed', String(b.dataset.kind === kind));
}

function persist() {
  $('save-status').textContent = saveLogbook(logbook) ? 'Saved locally' : 'Not saved · export a backup';
}

function openView(next) {
  if (next === 'roadmap' && view !== next) $('route-map').innerHTML = renderRoadmap(trophies, logbook.earned, isMasked);
  view = next;
  for (const b of document.querySelectorAll('.navigation [data-view]')) {
    if (b.dataset.view === next) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  }
  for (const id of ['tracker', 'roadmap', 'settings']) $(id).hidden = id !== next;
  if (next === 'tracker') renderTracker();
  $(next === 'tracker' ? 'search' : `${next}-title`).focus({ preventScroll: true });
}

function resetFilters() {
  kind = 'all';
  $('search').value = '';
  $('grade').value = 'all';
  $('hidden-toggle').checked = $('earned-toggle').checked = true;
}

$('kinds').innerHTML = Object.entries(kinds).map(([key, label]) => `<button type="button" data-kind="${key}" aria-pressed="false">${label}</button>`).join('');
$('search').addEventListener('input', renderTracker);
for (const id of ['grade', 'hidden-toggle', 'earned-toggle']) $(id).addEventListener('change', renderTracker);
$('trophy-list').addEventListener('change', e => {
  const id = Number(e.target.dataset.earn);
  if (!id) return;
  if (e.target.checked) logbook.earned.add(id);
  else logbook.earned.delete(id);
  persist();
  renderProgress();
  renderTracker();
});

$('spoiler-toggle').addEventListener('change', e => {
  reveals.clear();
  logbook.shield = e.target.checked;
  persist();
  syncControls();
});
$('export-save').addEventListener('click', () => {
  downloadLogbook(logbook);
  $('file-status').textContent = 'Exported leonida-progress.json.';
});
$('import-save').addEventListener('click', () => $('save-file').click());
$('save-file').addEventListener('change', async e => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    if (file.size > 65536) throw new Error('This file is too large to be an atlas export.');
    logbook = decodeLogbook(await file.text(), trophies);
    reveals.clear();
    persist();
    renderProgress();
    syncControls();
    $('file-status').textContent = `Imported ${logbook.earned.size} earned trophies.`;
  } catch (error) {
    const message = error instanceof SyntaxError ? 'This file is not valid JSON.' : error.message;
    $('file-status').textContent = `${message} Your current progress was kept.`;
  } finally {
    e.target.value = '';
  }
});

document.addEventListener('click', e => {
  const button = e.target.closest('button');
  if (!button) return;
  const data = button.dataset;
  if (data.view) openView(data.view);
  if (data.kind) {
    if (button.closest('#notice')) resetFilters();
    kind = data.kind;
    syncControls();
    renderTracker();
  }
  if (data.select) {
    selected = Number(data.select);
    renderTracker();
    if (matchMedia('(max-width: 800px)').matches) $('guide').querySelector('h3').focus();
  }
  if (data.reveal) {
    const fromGuide = button.closest('#guide');
    reveals.add(Number(data.reveal));
    renderTracker();
    if (fromGuide) $('guide').querySelector('h3')?.focus();
  }
  if (data.exit) {
    for (const exit of document.querySelectorAll('[data-exit]')) {
      const open = exit === button;
      exit.setAttribute('aria-expanded', String(open));
      $(`stops-${exit.dataset.exit}`).hidden = !open;
    }
    $(`stops-${data.exit}`).querySelector('h3').focus();
  }
  if (data.routeTrophy) {
    resetFilters();
    selected = Number(data.routeTrophy);
    syncControls();
    openView('tracker');
    $('guide').querySelector('h3').focus();
  }
});

syncControls();
renderProgress();
renderTracker();
