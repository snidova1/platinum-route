const STORAGE_KEY = 'leonida-route-progress';
const STARTER_KEY = 'gta6-trophy-checklist';

export const gradePoints = { bronze: 15, silver: 30, gold: 90, platinum: 300 };

export function parseBackup(text, trophies) {
  const data = JSON.parse(text);
  const legacy = Array.isArray(data);
  const entries = legacy ? data : data?.earned;
  if (!Array.isArray(entries) || entries.length > trophies.length ||
      (!legacy && (data.version !== 1 || typeof data.spoilers !== 'boolean'))) {
    throw new Error('Invalid backup format');
  }

  const byName = new Map(trophies.map(trophy => [trophy.name, trophy.id]));
  const ids = new Set(byName.values());
  const earned = new Set(entries.map(entry => {
    const id = legacy ? byName.get(entry) : entry;
    if (!ids.has(id)) throw new Error('Unknown trophy');
    return id;
  }));
  return { earned, spoilers: legacy || data.spoilers };
}

export function readProgress(trophies) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(STARTER_KEY);
    if (stored !== null) return parseBackup(stored, trophies);
  } catch {
    return { earned: new Set(), spoilers: true, readError: true };
  }
  return { earned: new Set(), spoilers: true };
}

export function serializeProgress({ earned, spoilers }) {
  return JSON.stringify({ version: 1, earned: [...earned].sort((a, b) => a - b), spoilers }, null, 2);
}

export function saveProgress(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, serializeProgress(progress));
    return true;
  } catch {
    return false;
  }
}

export function exportProgress(progress) {
  const url = URL.createObjectURL(new Blob([serializeProgress(progress) + '\n'], { type: 'application/json' }));
  const download = document.createElement('a');
  download.href = url;
  download.download = 'leonida-progress.json';
  download.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
