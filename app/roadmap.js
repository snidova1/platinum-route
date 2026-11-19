'use strict';

const exits = [
  { title: 'Story playthrough', sign: '01', summary: 'Five chapters · 12 story trophies', callout: 'Save at chapter boundaries. Finish the balcony session before leaving Chapter 1.' },
  { title: 'Collectibles & touring', sign: '02', summary: '52 areas · 100 scans · 100 vehicles · 3 card sets', callout: 'Keep going for 100%: 200 base-model vehicles and 15 sets. PowerPyx counts 18 card sets.' },
  { title: 'Activities & scores', sign: '03', summary: '42 range golds · 14 drone venues · 250 stunts', callout: 'Aim past the trophy targets: 42 drone trials, 300 stunts and 70 challenges count toward 100%.' },
  { title: 'Cleanup & platinum', sign: '04', summary: '8 stranger strands · 100% completion · platinum', callout: 'Check remaining side chains and one-offs. Clear A Long Road and all other trophies for the platinum.' },
];
const storyLegs = [
  [101, 110, 'Chapter 1'], [111, 120, 'Chapter 2'], [121, 130, 'Chapter 3'],
  [131, 150, 'Chapter 4'], [151, 159, 'Chapter 5'],
];

function renderRoadmap(trophies, earned, isMasked) {
  const inOrder = [...trophies].sort((a, b) => a.routeOrder - b.routeOrder);
  const row = trophy => `
    <li class="${trophy.missable ? 'route-risk' : ''}">
      ${gradeShield(trophy.grade)}
      <button type="button" class="road-trophy" data-route-trophy="${trophy.id}">
        ${escapeHtml(isMasked(trophy) ? 'Story trophy hidden' : trophy.name)}${earned.has(trophy.id) ? ' <span class="route-done">· Earned</span>' : ''}
        <span>${escapeHtml(trophy.missable ? 'POSSIBLE MISSABLE · Balcony before Chapter 1 ends' : isMasked(trophy) ? 'Spoiler shield on' : trophy.description)}</span>
      </button>
    </li>`;
  const sections = exits.map((exit, i) => {
    const stops = inOrder.filter(trophy => trophy.stage === i + 1);
    const done = stops.filter(trophy => earned.has(trophy.id)).length;
    return `
      <section class="exit" id="exit-${i + 1}">
        <span class="exit-sign">EXIT <b>${exit.sign}</b></span>
        <div class="exit-text"><h3>${exit.title}</h3><p>${exit.summary}${i === 0 ? ' · <strong class="exit-warning">Possible missable: balcony meditation</strong>' : ''}</p></div>
        <button type="button" data-exit="${i + 1}" aria-expanded="${i === 0}" aria-controls="stops-${i + 1}">${done} / ${stops.length} earned · View stops</button>
      </section>`;
  });
  return `<div class="highway">${sections.join('')}</div>${exits.map((exit, i) => {
    const stops = inOrder.filter(trophy => trophy.stage === i + 1);
    const lists = i === 0 ? storyLegs.map(([start, end, label]) => `<section><h4>${label}</h4><ul>${stops.filter(trophy => trophy.routeOrder >= start && trophy.routeOrder <= end).map(row).join('')}</ul></section>`).join('') : `<ul>${stops.map(row).join('')}</ul>`;
    return `<section class="exit-details" id="stops-${i + 1}" ${i ? 'hidden' : ''}><h3 tabindex="-1">Exit ${exit.sign} · ${exit.title}</h3><p class="exit-note">${exit.callout}</p><div class="${i === 0 ? 'chapter-columns' : ''}">${lists}</div></section>`;
  }).join('')}`;
}
