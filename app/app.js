import { roadmapStages, renderPlatinumRoadmap } from './roadmap.js';

const STORAGE_KEY = 'leonida-route-v1';
const $ = (id) => document.getElementById(id);
const escape = (value) => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const gradePoints = { bronze: 15, silver: 30, gold: 90, platinum: 300 };
let trophies = [];
let earned = new Set();
let selected = 28;
let activeKind = 'all';
let view = 'tracker';
let revealed = new Set();
let storageAvailable = true;

function readSavedProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved) {
      earned = new Set(saved.earned.filter(id => trophies.some(t => t.id === id)));
      $('spoilers').checked = saved.spoilers !== false;
    } else {
      const legacy = JSON.parse(localStorage.getItem('gta6-trophy-checklist') || '[]');
      earned = new Set(trophies.filter(t => legacy.includes(t.name)).map(t => t.id));
    }
  } catch { $('notice').textContent = 'Saved progress could not be read. Import a backup or start checking trophies.'; }
}

function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, earned: [...earned], spoilers: $('spoilers').checked }));
    storageAvailable = true;
  } catch { storageAvailable = false; }
  $('save-status').textContent = storageAvailable ? 'Saved on this device' : 'Storage unavailable · export a backup';
}

function isSpoilerMasked(trophy) {
  return $('spoilers').checked && trophy.kind === 'story' && !earned.has(trophy.id) && !revealed.has(trophy.id);
}

function shield(grade) {
  return `<span class="shield ${grade}" aria-label="${grade}"><svg viewBox="0 0 44 49" aria-hidden="true"><path d="M3 3 Q22 8 41 3 L41 23 Q40 36 22 46 Q4 36 3 23Z"/><path class="shield-rule" d="M5 15H39"/></svg><span>${grade[0].toUpperCase()}</span></span>`;
}

function setEarned(id, checked) {
  checked ? earned.add(id) : earned.delete(id);
  saveProgress();
  render();
}

function renderGradeProgress() {
  $('progress').textContent = `${earned.size} / 55`;
  $('meter-fill').style.width = `${earned.size / 55 * 100}%`;
  $('points').textContent = `${[...earned].reduce((sum,id) => sum + gradePoints[trophies.find(t => t.id === id).grade],0).toLocaleString('en-US')} / 1,350`;
  $('grade-progress').innerHTML = ['bronze','silver','gold','platinum'].map(grade => {
    const all = trophies.filter(t => t.grade === grade);
    const done = all.filter(t => earned.has(t.id)).length;
    return `<div class="grade-stat">${shield(grade)}<div><strong>${done}<em> / ${all.length}</em></strong><span>${grade}</span><progress value="${done}" max="${all.length}" aria-label="${grade} trophies"></progress></div></div>`;
  }).join('');
}

function filteredTrophies() {
  const query = $('search').value.trim().toLowerCase();
  const routeOrder = [28,2,3,30,15,35,17];
  const ordered = [...trophies].sort((a,b) => {
    const ai = routeOrder.indexOf(a.id), bi = routeOrder.indexOf(b.id);
    return (ai < 0 ? a.id + 100 : ai) - (bi < 0 ? b.id + 100 : bi);
  });
  return ordered.filter(t => {
    if (activeKind === 'missable' ? !t.missable : activeKind !== 'all' && t.kind !== activeKind) return false;
    if ($('grade').value !== 'all' && t.grade !== $('grade').value) return false;
    if (!$('hidden').checked && t.hidden && !earned.has(t.id)) return false;
    if (!$('earned').checked && earned.has(t.id)) return false;
    if (!query) return true;
    return (isSpoilerMasked(t) ? 'story trophy spoiler shield' : `${t.name} ${t.description} ${t.guide}`).toLowerCase().includes(query);
  });
}

function renderChecklist() {
  const filtered = filteredTrophies();
  $('results').textContent = `${filtered.length} of 55 shown`;
  $('rows').innerHTML = filtered.length ? filtered.map(t => {
    const masked = isSpoilerMasked(t);
    return `<article class="trophy-row ${selected === t.id ? 'selected' : ''} ${earned.has(t.id) ? 'is-earned' : ''}" data-id="${t.id}">
      <input class="trophy-check" type="checkbox" aria-label="Mark ${masked ? 'story trophy' : escape(t.name)} earned" data-earn="${t.id}" ${earned.has(t.id) ? 'checked' : ''}>
      ${shield(t.grade)}
      <div class="trophy-copy"><button class="trophy-name" data-select="${t.id}">${masked ? 'Story trophy protected' : escape(t.name)}</button><p>${masked ? 'Name and description hidden until earned.' : escape(t.description)}</p><div class="tags"><span>${masked ? 'SPOILER SHIELD' : t.kind.toUpperCase()}</span>${t.missable ? '<strong>POTENTIALLY MISSABLE</strong>' : ''}${t.count && !masked ? `<span>${t.count.toLocaleString('en-US')} ${t.id === 33 ? 'stars' : 'target'}</span>` : ''}${earned.has(t.id) ? '<span class="earned-tag">EARNED</span>' : ''}</div></div>
      <button class="row-action" ${masked ? `data-reveal="${t.id}"` : `data-select="${t.id}"`}>${masked ? 'Reveal' : 'Guide →'}</button>
    </article>`;
  }).join('') : '<div class="empty"><h3>No trophies on this route.</h3><p>Try a different search or reset the filters.</p><button id="clear-filters">Clear filters</button></div>';
}

function renderCitedGuide() {
  const t = trophies.find(t => t.id === selected);
  $('guide').classList.toggle('long-guide', t.id === 28);
  if (isSpoilerMasked(t)) {
    $('guide').innerHTML = `<div class="guide-sign"><h2>Spoiler shield active</h2><p>Story trophy · ${t.grade}</p></div><div class="guide-body"><p>This trophy’s name, description and guide stay hidden until you earn it.</p><button data-reveal="${t.id}">Reveal this trophy</button></div>`;
    return;
  }
  const stage = roadmapStages.find(s => s.id === t.stage);
  const sources = `<section class="guide-sources"><h3>Sources & verification</h3><ul class="source-links">${t.sources.map(s => `<li><a href="${escape(s.url)}" target="_blank" rel="noopener noreferrer">${escape(s.name)} ↗</a></li>`).join('')}</ul></section>`;
  $('guide').innerHTML = `<div class="guide-sign"><div class="guide-title">${shield(t.grade)}<h2>${escape(t.name)}</h2></div><p>${escape(t.description)}</p></div>
    <div class="guide-body"><div class="guide-location">EXIT ${t.stage} / ${escape(stage.short)}</div>${!t.missable ? sources : ''}${t.missable ? `<div class="missable-warning"><strong>Possible missable · Chapter 1</strong><p>Keep a save before leaving the chapter. The balcony opportunity disappears; trophy necessity is unconfirmed.</p></div>` : ''}<h3>Field notes</h3><p class="guide-text">${escape(t.guide)}</p><div class="evidence-label">${escape(t.evidence)}</div>${t.missable ? sources : ''}<label class="guide-complete"><input type="checkbox" data-earn="${t.id}" ${earned.has(t.id) ? 'checked' : ''}> Mark trophy earned</label><small class="research-date">Researched 19 Nov 2026 · Links open only on click</small></div>`;
}

function render() {
  renderGradeProgress();
  renderChecklist();
  renderCitedGuide();
  renderPlatinumRoadmap($('roadmap-view'), trophies, earned, isSpoilerMasked, escape);
}

function switchView(next) {
  view = next;
  $('tracker-view').hidden = view !== 'tracker';
  $('roadmap-view').hidden = view !== 'roadmap';
  document.querySelector('.filters').hidden = view === 'roadmap';
  $('tracker-tab').setAttribute('aria-pressed', String(view === 'tracker'));
  $('roadmap-tab').setAttribute('aria-pressed', String(view === 'roadmap'));
}

function setKind(kind) {
  activeKind = kind;
  document.querySelectorAll('[data-kind]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.kind === kind)));
  renderChecklist();
}

function clearFilters() {
  setKind('all');
  $('search').value = '';
  $('grade').value = 'all';
  $('hidden').checked = true;
  $('earned').checked = true;
  renderChecklist();
}

function exportProgress() {
  const payload = { app: 'leonida-route', version: 1, earned: [...earned].sort((a,b)=>a-b), spoilers: $('spoilers').checked };
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'leonida-route-progress.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  $('notice').textContent = 'Progress exported. Import this JSON file to restore your checklist and spoiler setting.';
}

async function importProgress(event) {
  const file = event.target.files[0];
  if (!file) return;
  try {
    if (file.size > 100000) throw new Error('Backup is too large. Choose a Leonida Route JSON export.');
    const payload = JSON.parse(await file.text());
    if (payload.app !== 'leonida-route' || payload.version !== 1 || !Array.isArray(payload.earned) || payload.earned.some(id => !Number.isInteger(id) || !trophies.some(t=>t.id===id)) || typeof payload.spoilers !== 'boolean') throw new Error('Invalid backup. Choose a version 1 Leonida Route export.');
    earned = new Set(payload.earned);
    $('spoilers').checked = payload.spoilers;
    revealed.clear();
    saveProgress();
    render();
    $('notice').textContent = `Imported ${earned.size} earned trophies. Your previous checklist has been replaced.`;
  } catch(error) { $('notice').textContent = `Import failed: ${error.message}. Your progress has not changed.`; }
  event.target.value = '';
}

function bindChecklistControls() {
  document.addEventListener('click', event => {
    const target = event.target.closest('button');
    if (!target) return;
    if (target.dataset.kind) setKind(target.dataset.kind);
    if (target.dataset.select) { selected = Number(target.dataset.select); switchView('tracker'); render(); }
    if (target.dataset.reveal) { revealed.add(Number(target.dataset.reveal)); selected = Number(target.dataset.reveal); render(); }
    if (target.id === 'clear-filters') clearFilters();
  });
  document.addEventListener('change', event => {
    if (event.target.dataset.earn) setEarned(Number(event.target.dataset.earn), event.target.checked);
  });
  $('search').addEventListener('input', renderChecklist);
  ['grade','hidden','earned'].forEach(id => $(id).addEventListener('change', renderChecklist));
  $('spoilers').addEventListener('change', () => { revealed.clear(); saveProgress(); render(); });
  $('tracker-tab').addEventListener('click', () => switchView('tracker'));
  $('roadmap-tab').addEventListener('click', () => switchView('roadmap'));
  $('checkpoint-guide').addEventListener('click', () => { selected = 28; switchView('tracker'); render(); });
  $('export').addEventListener('click', exportProgress);
  $('import').addEventListener('change', importProgress);
}

async function initializeOfflineTracker() {
  try {
    const response = await fetch('./data/trophies.json');
    if (!response.ok) throw new Error('Trophy data unavailable');
    trophies = (await response.json()).trophies;
    readSavedProgress();
    const kinds = [['all','All 55'],['story','Story'],['missable','Missable'],['collectible','Collectibles'],['activity','Activities'],['misc','Miscellaneous']];
    $('kind-filters').innerHTML = kinds.map(([kind,label]) => `<button data-kind="${kind}" aria-pressed="${kind==='all'}">${label}${kind==='missable' ? ' <span class="filter-count">1</span>' : ''}</button>`).join('');
    bindChecklistControls();
    render();
    document.body.dataset.ready = 'true';
  } catch { $('notice').textContent = 'Could not load the local trophy list. Serve app/ with node serve.ts and reload.'; }
}
initializeOfflineTracker();
