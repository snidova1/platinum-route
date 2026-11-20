import { exportProgress, gradePoints, parseBackup, readProgress, saveProgress } from './progress.js';
import { platinumRoute, routeSources } from './roadmap.js';

const byId = id => document.getElementById(id);
const list = byId('trophy-list');
const fieldGuide = byId('field-guide');
const kindLabels = { story: 'Story', collectible: 'Collectible', activity: 'Activity', misc: 'Misc', online: 'Online' };
const gradeLabels = { bronze: 'Bronze', silver: 'Silver', gold: 'Gold', platinum: 'Platinum' };
const featured = [2, 3, 28, 30, 31, 17, 18];
const spoilerControls = ['spoilers', 'route-spoilers', 'settings-spoilers'];

let trophies = [];
let trophyById = new Map();
let progress;
let activeKind = 'all';
let selectedId = 28;
let activeView = 'tracker';
let activeExit = 0;
const revealed = new Set();

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function button(className, text, handler) {
  const node = element('button', className, text);
  node.type = 'button';
  node.addEventListener('click', handler);
  return node;
}

function shield(grade) {
  const node = element('span', 'grade-shield ' + grade);
  node.setAttribute('aria-hidden', 'true');
  node.append(byId('grade-shape').content.cloneNode(true), element('span', '', gradeLabels[grade].slice(0, 2).toUpperCase()));
  return node;
}

function isShielded(trophy) {
  return progress.spoilers && trophy.kind === 'story' && !progress.earned.has(trophy.id) && !revealed.has(trophy.id);
}

function filterTrophies() {
  const term = byId('search').value.trim().toLocaleLowerCase();
  const grade = byId('grade').value;
  return trophies.filter(trophy => {
    const matchesKind = activeKind === 'all' ||
      (activeKind === 'missable' ? trophy.missable : trophy.kind === activeKind);
    if (!matchesKind || (grade !== 'all' && trophy.grade !== grade)) return false;
    if (!byId('show-hidden').checked && trophy.hidden) return false;
    if (!byId('show-earned').checked && progress.earned.has(trophy.id)) return false;
    const searchable = isShielded(trophy) ? 'story trophy' : trophy.name + ' ' + trophy.description;
    return searchable.toLocaleLowerCase().includes(term);
  });
}

function renderProgress() {
  byId('earned-total').textContent = progress.earned.size + ' / ' + trophies.length;
  byId('trophy-progress').value = progress.earned.size;
  let earnedPoints = 0;
  let totalPoints = 0;
  const grades = Object.entries(gradeLabels).map(([grade, label]) => {
    const entries = trophies.filter(trophy => trophy.grade === grade);
    const earned = entries.filter(trophy => progress.earned.has(trophy.id)).length;
    earnedPoints += earned * gradePoints[grade];
    totalPoints += entries.length * gradePoints[grade];
    const metric = element('div', 'grade-metric');
    const text = element('div');
    text.append(element('span', '', label), element('strong', '', earned + ' / ' + entries.length));
    metric.append(shield(grade), text);
    metric.title = label + ' · ' + earned * gradePoints[grade] + ' of ' + entries.length * gradePoints[grade] + ' points';
    return metric;
  });
  byId('grade-progress').replaceChildren(...grades);
  byId('points-total').textContent = earnedPoints.toLocaleString('en-US') + ' / ' + totalPoints.toLocaleString('en-US');
}

function saveToBrowser() {
  const note = byId('storage-note');
  note.hidden = saveProgress(progress);
  note.textContent = note.hidden ? '' : 'Browser storage is unavailable. Export JSON to keep your current progress.';
}

function markTrophy(trophy, checked) {
  if (checked) progress.earned.add(trophy.id);
  else progress.earned.delete(trophy.id);
  saveToBrowser();
  renderTracker();
}

function selectTrophy(id) {
  selectedId = id;
  for (const row of list.children) {
    const pick = row.querySelector('[data-action=pick]');
    if (Number(row.dataset.id) === id) pick.setAttribute('aria-current', 'true');
    else pick.removeAttribute('aria-current');
  }
  renderGuide(trophyById.get(id));
}

function focusGuide() {
  fieldGuide.querySelector('#guide-name')?.focus({ preventScroll: !matchMedia('(max-width: 795px)').matches });
}

function revealTrophy(id) {
  revealed.add(id);
  selectedId = id;
  renderTracker();
}

function trophyRow(trophy) {
  const masked = isShielded(trophy);
  const title = masked ? 'Story trophy shielded' : trophy.name;
  const row = element('li', 'trophy-row');
  row.dataset.id = trophy.id;
  const check = element('input', 'earned-check');
  check.type = 'checkbox';
  check.checked = progress.earned.has(trophy.id);
  check.dataset.action = 'check';
  check.setAttribute('aria-label', 'Earned: ' + title + (masked ? ' ' + trophy.id : ''));
  check.addEventListener('change', () => markTrophy(trophy, check.checked));

  const pick = button('trophy-pick', '', event => {
    selectTrophy(trophy.id);
    if (event.detail === 0 || matchMedia('(max-width: 795px)').matches) focusGuide();
  });
  pick.dataset.action = 'pick';
  pick.setAttribute('aria-controls', 'field-guide');
  if (trophy.id === selectedId) pick.setAttribute('aria-current', 'true');
  pick.append(
    element('strong', 'trophy-name', title),
    element('span', 'trophy-description', masked ? 'Earn it or reveal this entry.' : trophy.description)
  );

  const meta = element('div', 'row-meta');
  meta.append(element('span', 'kind-label', kindLabels[trophy.kind]));
  if (trophy.missable) meta.append(element('span', 'risk-label', 'Potentially missable'));
  if (masked) {
    const reveal = button('reveal-button', 'Reveal', () => revealTrophy(trophy.id));
    reveal.dataset.action = 'reveal';
    meta.replaceChildren(reveal);
  }
  const badge = element('span', 'row-grade');
  badge.setAttribute('role', 'img');
  badge.setAttribute('aria-label', gradeLabels[trophy.grade]);
  badge.append(shield(trophy.grade));
  row.append(check, badge, pick, meta);
  return row;
}

function sourceLinks(sources) {
  const links = element('ul', 'source-links');
  for (const source of sources) {
    const item = element('li');
    const link = element('a', '', source.name);
    link.href = source.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    item.append(link);
    links.append(item);
  }
  return links;
}

function renderGuide(trophy) {
  if (!trophy) {
    const title = element('h3', '', 'No trophy selected');
    title.id = 'guide-name';
    title.tabIndex = -1;
    fieldGuide.replaceChildren(element('div', 'guide-bar', 'Trophy guide'), title);
    return;
  }

  const masked = isShielded(trophy);
  const bar = element('div', 'guide-bar');
  bar.append(element('strong', '', 'Trophy guide'), element('span', '', 'Exit ' + String(trophy.stage).padStart(2, '0')));
  const body = element('div', 'guide-body');
  const title = element('h3', '', masked ? 'Story trophy shielded' : trophy.name);
  title.id = 'guide-name';
  title.tabIndex = -1;
  const tags = element('div', 'guide-tags');
  tags.append(shield(trophy.grade), element('strong', '', gradeLabels[trophy.grade]), element('span', '', kindLabels[trophy.kind]));
  if (trophy.missable) tags.append(element('span', 'risk-label', 'Potentially missable'));
  body.append(title, tags);

  if (masked) {
    body.append(element('p', 'guide-copy', 'Names, descriptions and guides stay covered until you earn or reveal the trophy.'));
    body.append(button('primary', 'Reveal this trophy', () => revealTrophy(trophy.id)));
  } else {
    const official = element('p', 'official-description', trophy.description);
    const risk = element('p', trophy.missable ? 'guide-risk' : 'guide-window', trophy.missableReason);
    body.append(official, element('p', 'guide-copy', trophy.guide), risk, element('h4', 'source-heading', 'Sources'), sourceLinks(trophy.sources));
  }
  fieldGuide.replaceChildren(bar, body);
}

function renderTracker() {
  const previous = document.activeElement;
  const focusId = previous.closest('[data-id]')?.dataset.id;
  const focusAction = previous.dataset.action;
  const results = filterTrophies();
  if (!results.some(trophy => trophy.id === selectedId)) selectedId = results[0]?.id;
  list.replaceChildren(...results.map(trophyRow));
  byId('empty-list').hidden = results.length > 0;
  byId('result-count').textContent = results.length + ' of ' + trophies.length;
  renderProgress();
  renderGuide(trophyById.get(selectedId));
  if (focusId) {
    const row = list.querySelector('[data-id="' + focusId + '"]');
    const next = row?.querySelector('[data-action="' + focusAction + '"]') ?? row?.querySelector('[data-action=pick]') ?? byId('search');
    next.focus({ preventScroll: true });
  }
}

function setKind(kind) {
  activeKind = kind;
  byId('checkpoint').hidden = kind === 'missable';
  for (const control of byId('kind-filters').children) {
    control.setAttribute('aria-pressed', control.dataset.kind === kind);
  }
  renderTracker();
}

function openTrophy(id, missableOnly = false) {
  selectedId = id;
  byId('search').value = '';
  byId('grade').value = 'all';
  byId('show-hidden').checked = true;
  byId('show-earned').checked = true;
  setKind(missableOnly ? 'missable' : 'all');
  openView('tracker');
  focusGuide();
}

function routeStop(id) {
  const trophy = trophyById.get(id);
  const masked = isShielded(trophy);
  const stop = button('route-stop', '', () => openTrophy(id, trophy.missable));
  const details = element('span', 'stop-copy');
  details.append(
    element('strong', '', masked ? 'Story trophy shielded' : trophy.name),
    element('small', '', masked ? 'View or reveal in tracker' : trophy.description)
  );
  stop.append(shield(trophy.grade), details);
  if (trophy.missable) stop.classList.add('missable-stop');
  if (progress.earned.has(id)) stop.append(element('span', 'route-earned', 'Earned'));
  const item = element('li');
  item.append(stop);
  return item;
}

function renderRoadmap() {
  const signs = platinumRoute.map((exit, index) => {
    const sign = button('exit-sign', '', () => {
      activeExit = index;
      renderRoadmap();
      byId('exit-signs').children[index].firstElementChild.focus({ preventScroll: true });
    });
    sign.setAttribute('aria-pressed', index === activeExit);
    sign.setAttribute('aria-controls', 'route-details');
    sign.append(
      element('span', 'exit-number', 'Exit ' + String(index + 1).padStart(2, '0')),
      element('strong', '', exit.title),
      element('span', 'exit-summary', exit.sign)
    );
    const item = element('li');
    item.append(sign);
    return item;
  });
  byId('exit-signs').replaceChildren(...signs);

  const exit = platinumRoute[activeExit];
  const details = byId('route-details');
  const groups = element('div', 'route-groups');
  for (const [label, stops] of exit.groups) {
    const group = element('section', 'chapter');
    const stopList = element('ol');
    stopList.append(...stops.map(routeStop));
    group.append(element('h4', '', label), stopList);
    groups.append(group);
  }
  const heading = element('div', 'route-detail-heading');
  heading.append(element('h3', '', exit.title), element('p', '', exit.detail));
  details.replaceChildren(heading, groups);
  if (exit.crossLink) {
    details.append(button('route-crosslink', exit.crossLabel, () => openTrophy(exit.crossLink, true)));
  }
  const sources = element('div', 'route-sources');
  sources.append(element('strong', '', 'Route sources'), sourceLinks(routeSources));
  details.append(sources);
}

function openView(view) {
  activeView = view;
  for (const control of document.querySelectorAll('nav [data-view]')) {
    const current = control.dataset.view === view;
    byId(control.dataset.view).hidden = !current;
    if (current) control.setAttribute('aria-current', 'page');
    else control.removeAttribute('aria-current');
  }
  if (view === 'roadmap') renderRoadmap();
  window.scrollTo(0, 0);
}

function syncSpoilers() {
  for (const id of spoilerControls) byId(id).checked = progress.spoilers;
  renderTracker();
  if (activeView === 'roadmap') renderRoadmap();
}

function attachControls() {
  for (const control of byId('kind-filters').children) {
    control.addEventListener('click', () => setKind(control.dataset.kind));
  }
  for (const control of document.querySelectorAll('nav [data-view]')) {
    control.addEventListener('click', () => openView(control.dataset.view));
  }
  byId('search').addEventListener('input', renderTracker);
  for (const id of ['grade', 'show-hidden', 'show-earned']) {
    byId(id).addEventListener('change', renderTracker);
  }
  for (const id of spoilerControls) {
    byId(id).addEventListener('change', event => {
      progress.spoilers = event.target.checked;
      revealed.clear();
      saveToBrowser();
      syncSpoilers();
    });
  }

  byId('checkpoint').addEventListener('click', () => openTrophy(28, true));
  byId('route-checkpoint').addEventListener('click', () => openTrophy(28, true));
  byId('export-backup').addEventListener('click', () => {
    exportProgress(progress);
    byId('backup-status').textContent = 'Backup downloaded.';
  });
  const fileInput = byId('backup-file');
  byId('import-backup').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;
    try {
      if (file.size > 65536) throw new Error('Backup too large');
      progress = parseBackup(await file.text(), trophies);
      revealed.clear();
      saveToBrowser();
      syncSpoilers();
      byId('backup-status').textContent = 'Restored ' + progress.earned.size + ' earned trophies.';
    } catch {
      byId('backup-status').textContent = 'Choose a valid Leonida progress backup. Your checklist is unchanged.';
    } finally {
      fileInput.value = '';
    }
  });
}

async function loadTrophies() {
  const response = await fetch('./data/trophies.json');
  if (!response.ok) throw new Error('Trophy data unavailable');
  const data = await response.json();
  trophyById = new Map(data.trophies.map(trophy => [trophy.id, trophy]));
  const front = new Set(featured);
  trophies = [...featured.map(id => trophyById.get(id)), ...data.trophies.filter(trophy => !front.has(trophy.id))];
}

try {
  await loadTrophies();
  progress = readProgress(trophies);
  if (progress.readError) {
    const note = byId('storage-note');
    note.hidden = false;
    note.textContent = 'The saved checklist could not be read. You can restore it from a JSON backup.';
  }
  attachControls();
  syncSpoilers();
  openView('tracker');
  byId('load-status').hidden = true;
} catch {
  byId('load-status').textContent = 'Could not load the trophy list. Open the guide through its local static server and reload.';
}
