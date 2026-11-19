'use strict';

const SAVE_KEY = 'leonida-route-map.v1';
const TROPHY_POINTS = { bronze: 15, silver: 30, gold: 90, platinum: 300 };

function emptyLogbook() {
  return { earned: new Set(), shield: true };
}

function readLogbook(trophies) {
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) return decodeLogbook(saved, trophies);
    const starter = localStorage.getItem('gta6-trophy-checklist');
    return starter ? decodeLogbook(starter, trophies) : emptyLogbook();
  } catch {
    return emptyLogbook();
  }
}

function encodeLogbook(logbook) {
  return JSON.stringify({ app: 'leonida-route-map', version: 1, earned: [...logbook.earned].sort((a, b) => a - b), shield: logbook.shield }, null, 2);
}

function decodeLogbook(text, trophies) {
  const save = JSON.parse(text);
  if (Array.isArray(save)) {
    const names = new Map(trophies.map(trophy => [trophy.name, trophy.id]));
    if (save.some(name => !names.has(name))) throw new Error('This is not a GTA VI starter save.');
    return { earned: new Set(save.map(name => names.get(name))), shield: true };
  }
  if (save?.app !== 'leonida-route-map' || save.version !== 1 || typeof save.shield !== 'boolean' || !Array.isArray(save.earned)) {
    throw new Error('Choose a Leonida Route Map JSON export.');
  }
  const ids = new Set(trophies.map(trophy => trophy.id));
  if (save.earned.some(id => !ids.has(id))) throw new Error('The file contains an unknown trophy ID.');
  return { earned: new Set(save.earned), shield: save.shield };
}

function saveLogbook(logbook) {
  try {
    localStorage.setItem(SAVE_KEY, encodeLogbook(logbook));
    return true;
  } catch {
    return false;
  }
}

function downloadLogbook(logbook) {
  const href = URL.createObjectURL(new Blob([encodeLogbook(logbook) + '\n'], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = href;
  link.download = 'leonida-progress.json';
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(href), 1000);
}

function progressByGrade(trophies, earned) {
  return Object.entries(TROPHY_POINTS).map(([grade, points]) => {
    const group = trophies.filter(trophy => trophy.grade === grade);
    return { grade, points, total: group.length, earned: group.filter(trophy => earned.has(trophy.id)).length };
  });
}
