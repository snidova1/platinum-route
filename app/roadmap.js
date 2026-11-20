export const platinumRoute = [
  {
    title: 'Story playthrough',
    sign: 'Chapters 1–5',
    detail: 'Follow the main missions. Stop for the balcony meditation before leaving Chapter 1.',
    groups: [
      ['Chapter 1', [2, 28, 3]],
      ['Chapter 2', [8, 4]],
      ['Chapter 3', [9, 5]],
      ['Chapter 4', [10, 11, 12, 6]],
      ['Chapter 5', [13, 7]]
    ]
  },
  {
    title: 'Collectibles',
    sign: '3 card sets · 100 scans',
    detail: 'Log discoveries along the way. Keep collecting for 100% after the trophy thresholds.',
    groups: [
      ['Pickups and scans', [30, 31, 35]],
      ['Explore the state', [42]]
    ],
    crossLink: 28,
    crossLabel: 'Return for the other meditation spots after the Chapter 1 checkpoint.'
  },
  {
    title: 'Activities',
    sign: '250 stunts · 42 range golds',
    detail: 'Try all nine activity types, then clear the repeatable courses and robbery objectives.',
    groups: [
      ['Courses and challenges', [16, 20, 21, 29, 19, 18, 17, 15, 32]],
      ['Partner and robbery jobs', [33, 34, 36, 39, 41, 40, 43, 46]]
    ]
  },
  {
    title: 'Cleanup & platinum',
    sign: '100% completion · 54 trophies',
    detail: 'Finish remaining strands and one-off trophies, then close the in-game 100% checklist.',
    groups: [
      ['Side strands', [23, 24, 22, 26, 27, 25]],
      ['Free-roam trophies', [37, 38, 44, 45, 47, 48, 49, 50, 51, 52, 53, 54, 55]],
      ['Finish the route', [14, 1]]
    ]
  }
];

export const routeSources = [
  { name: 'PowerPyx · Mission order', url: 'https://www.powerpyx.com/gta-6-full-walkthrough-all-missions/' },
  { name: 'PowerPyx · 100% checklist', url: 'https://www.powerpyx.com/gta-6-100-completion-checklist-guide/' }
];
