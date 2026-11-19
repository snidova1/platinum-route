import { readFileSync, writeFileSync } from 'node:fs';

const path = new URL('../app/data/trophies.json', import.meta.url);
const official = JSON.parse(readFileSync(path, 'utf8'));
const py = 'https://www.powerpyx.com/gta-6-';
const sources = {
  ps: { name: 'Official description · PSNProfiles', url: 'https://psnprofiles.com/trophies/43531-grand-theft-auto-vi' },
  ex: { name: 'Exophase · PS5 list', url: 'https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/' },
  pp: { name: 'PowerPyx · Trophy roadmap', url: py + 'grand-theft-auto-vi-trophy-guide-roadmap/' },
  story: { name: 'PowerPyx · Mission order', url: py + 'full-walkthrough-all-missions/' },
  full: { name: 'PowerPyx · 100% checklist', url: py + '100-completion-checklist-guide/' },
  push: { name: 'Push Square · Trophy guide', url: 'https://www.pushsquare.com/guides/gta-6-trophy-guide-and-roadmap' },
  zen: { name: 'PowerPyx · Meditation map', url: py + 'all-meditation-spot-locations/' },
  cards: { name: 'PowerPyx · Card sets', url: py + 'all-collectible-card-sets-locations/' },
  drone: { name: 'PowerPyx · Drone courses', url: py + 'all-top-fun-drone-race-time-trial-locations/' },
  range: { name: 'PowerPyx · Range courses', url: py + 'all-shooting-range-gold-medal-challenges/' },
  cal: { name: 'GameRant · Cal’s fishing challenge', url: 'https://gamerant.com/gta-6-2-pound-stoplight-parrotfish-bigger-fish-cal/' },
  database: { name: 'PowerPyx · Progress database', url: py + 'collectible-guide-progress-database/' },
};

// Id, route order, tracked count, kind, supplemental citations, original guidance.
const notes = [
[1, 499, null, 'misc', 'pp ex', 'Earn the other 54 PS5 trophies to finish the route. PowerPyx confirms this is a solo list: finish the campaign, close out the in-game percentage checklist, then compare your outstanding trophies against the separate side chains and one-off tasks.'],
[2, 101, null, 'story', 'story pp', 'PowerPyx places Gone Fishing at the very start of Chapter 1. Follow the main objectives through to the mission end; this is automatic, with no optional score to beat.'],
[3, 111, 1, 'story', 'story pp', 'Finish Chapter 1 and keep going into What’s in the Bag? PowerPyx puts the unlock after that first Chapter 2 mission, so a missing notification at the chapter break need not mean you missed it.'],
[4, 121, 2, 'story', 'story pp', 'PowerPyx places the notification after Welcome to Vice City, which starts Chapter 3. Play into the next chapter before troubleshooting this automatic milestone.'],
[5, 131, 3, 'story', 'story pp', 'PowerPyx reports that the Chapter 3 trophy arrives after Ocean Beach and Another Life near the start of Chapter 4. Continue the main line; it is not a request to clear every side marker.'],
[6, 149, 4, 'story', 'story pp', 'Carry Chapter 4 through Starting From Zero, which PowerPyx lists at the end of the chapter. The award follows story progress, not completion of the chapter’s optional jobs.'],
[7, 159, null, 'story', 'pp story', 'From the official description, clear the campaign finale. PowerPyx treats this as an automatic story award; continue along the Chapter 5 main line rather than chasing a named side job.'],
[8, 115, null, 'story', 'story pp', 'In its Chapter 2 sequence, PowerPyx lists Breakfast Run under the map prompt Check on Jason. Follow that main mission to completion; the unlock has no separate performance requirement.'],
[9, 125, null, 'story', 'story pp', 'Play the Chapter 3 story until The Cartel Heist appears, as listed by PowerPyx. Clear that mission rather than trying a separate free-roam robbery; its trophy is automatic.'],
[10, 142, null, 'story', 'story pp', 'PowerPyx identifies Rescue Rafa from Kidnappers as the Chapter 4 prompt for Child’s Play. Finish that main mission; it does not require an optional medal.'],
[11, 144, null, 'story', 'story pp', 'In Chapter 4, take the launch-party main mission called Headliners in the PowerPyx walkthrough. It awards the trophy at completion, so there is no extra party objective to look for afterward.'],
[12, 146, null, 'story', 'story pp', 'Follow the Chapter 4 airport operation through the actual VCIA Takedown mission. PowerPyx lists a run of preparation jobs; completing an individual prep or taking a jet in free roam is not the story unlock.'],
[13, 153, null, 'story', 'story pp', 'PowerPyx puts Operation Savage Glory in Chapter 5, after the early missions of that chapter. Finish it on the main path; this automatic bronze is separate from the gold for the finale.'],
[14, 498, 100, 'misc', 'full pp', 'After the credits, open Progress → Stats → 100% Completion; PowerPyx says work done earlier still counts. Do not stop at the standalone trophy thresholds: the checklist calls for 300 stunts, 70 challenges, 200 base-model vehicle scans and 100 animal studies. Finish the remaining checklist categories in post-story free roam.'],
[15, 318, 250, 'activity', 'push pp', 'Mix jumps, bridge fly-unders, knife flights and base jumps; Push Square lists 397 possible stunts. Check Progress → Activities → Stunts for credit, then keep going to 300 for the 100% checklist, per PowerPyx.'],
[16, 325, 9, 'activity', 'pp push', 'Use Progress → Activities to spot gaps across fishing, hunting, golf, ranges, pool, basketball, video games, racing and stunts, per PowerPyx. Make one credited attempt in each category and leave any gaps for the end of your wider activity sweep.'],
[17, 311, 42, 'activity', 'range push', 'Push Square maps both sites under Activities → Shooting Ranges. PowerPyx recommends buying each clerk’s waiver and clearing every tier: 18 golds at Griffin, 24 at Rodgers Ranch. Check the medal after each run.'],
[18, 313, 14, 'activity', 'drone push', 'Push Square points to Map → Activities → Drones → Top Fun Drones for discovered venues. Get a win at each of the 14 locations, not 14 wins at one, and use PowerPyx’s course list to finish all 42 trials for the percentage checklist.'],
[19, 314, 20, 'activity', 'pp push', 'PowerPyx counts 40 distinct races; rotate venues until you have 20 different wins. Repeating a familiar winner does not advance the unique-race target, so log each new course as you clear it.'],
[20, 321, null, 'activity', 'cal pp', 'Watch for Cal’s fishing message and follow his purple marker, which PowerPyx ties to the Chapter 1 introduction. GameRant identifies his benchmark as a two-pound Stoplight Parrotfish; beat the weight in his challenge, not just your own prior catch.'],
[21, 323, null, 'activity', 'pp push', 'PowerPyx gives Bang For Your Buck at an arcade machine and the home TV games as options. Pick one game and finish its levels rather than just launching it; if the home setup is temporarily unavailable, return after the story.'],
[22, 410, null, 'activity', 'pp story', 'As Lucia, watch for Andy’s call and the Belville address during Chapter 3, per PowerPyx. Follow the chain to Puff Puff Pass at the warehouse; you can return to this line in post-story free roam.'],
[23, 411, null, 'activity', 'pp story', 'Look for Kenton’s KR marker in Key Lento after Island Dreams in Chapter 1, per PowerPyx. Use the underwater detector and return the salvage from seven wrecks. His temporary absence later in the story is not a permanent lockout.'],
[24, 412, null, 'activity', 'pp story', 'PowerPyx places Billy’s opening job at the Thrillbilly Mudclub in Kelly County after Coffee Break. Take his jobs through Hometown Heroes, not just the first mud-club visit; the chain is available after the campaign.'],
[25, 415, 8, 'activity', 'pp story', 'Finish eight complete stranger chains and check the PS5 counter after each last job. PowerPyx names Kirk, Kyle, Yago and Pilot Pete as examples and distinguishes them from ordinary optional chains such as Billy’s and Tyrone’s. Save this target for free-roam cleanup if needed.'],
[26, 413, null, 'activity', 'pp story', 'PowerPyx points to the Chapter 3 Key Cloner introduction and Randy’s western Vice City garage. Open Map → Robberies → Randy’s Wish List, then deliver his 16 requested models; deliveries can continue after the story.'],
[27, 414, null, 'activity', 'pp story', 'After Here, Kitty Kitty in Chapter 3, use Jason and look for the Synthetic Lab markers in Vice City. PowerPyx routes this through Take Out Kitty Litter to Spin On This; the initial lab visit alone is not the finale.'],
[28, 105, 18, 'missable', 'zen pp push', 'PowerPyx suggests checking Jason’s kitchen in the morning after Down to Earth. Follow Lucia onto the balcony and accept before Chapter 1 ends. For the 18-session sweep, Push Square says to wait for the closing animation before moving on.'],
[29, 322, null, 'activity', 'pp story', 'After Coffee Break, watch for Bret’s text as Jason and start Veteran Hunted in Lummox County, per PowerPyx. Work through his purple hunting targets and return the requested animals. The exact trophy animal is unconfirmed there, but the 100% checklist takes all 15 Target Decks.'],
[30, 221, 3, 'collectible', 'cards full', 'PowerPyx’s card map groups the finds into 18 sets. Choose three sets and work each to completion instead of collecting loose cards across all of them; check indoor surfaces and yellow phone boxes along the route. Keep going to 15 sets for the 100% checklist.'],
[31, 213, 100, 'collectible', 'pp database', 'Use the phone’s WAiNK scanner on new landmarks, curiosities, sculptures and No Flusher tags while exploring, per PowerPyx. Mix those categories until your location total reaches 100; vehicle scans are a different target.'],
[32, 329, 50, 'activity', 'pp full', 'Let other trophies fill the Progress → Challenges list first. PowerPyx counts 80 possible challenges: use the Completed marks to pick manageable gaps on the way to 50, then reach 70 for the percentage checklist.'],
[33, 346, 4, 'activity', 'pp', 'PowerPyx puts partner free roam after Coffee Break in Chapter 2. Reach four stars with your partner present, then clear the larger heat area, not just the immediate search circle; the train tunnel north of Ambrosia is the guide’s suggested in-game escape.'],
[34, 345, 3, 'activity', 'pp', 'Bring your partner after Coffee Break and take loot from three shops without letting the pursuit end. PowerPyx suggests chaining the north Vice City jewelers after Yasmani’s introduction; if the first shop preceded active pursuit, try another while the stars are still up.'],
[35, 215, 100, 'collectible', 'pp full', 'Per PowerPyx, scan distinct vehicles in WAiNK; there is no need to drive them. Work a busy road first, then add boats and aircraft as you travel. Log 100 discoveries for bronze, but aim for 200 base models toward 100%.'],
[36, 335, 5, 'activity', 'pp', 'PowerPyx suggests building Focus at the shooting range first, then lining up five gang-operation enemies. Take them down during one continuous use of Combat Focus; splitting the five across activations will not meet the trophy condition.'],
[37, 424, null, 'misc', 'pp', 'PowerPyx recommends an airliner at a passenger gate at VCIA, such as E3 or E4, rather than a plane parked away from the terminal. Board by the gate stairs, take off and fly clear of the airport; this is distinct from the story trophy for VCIA Takedown.'],
[38, 425, null, 'misc', 'pp', 'PowerPyx points to the Rhinos on the south side of Mile Zero Air Station in Mariana County. In free roam, take control of a Rhino there and use it until the notification appears.'],
[39, 341, null, 'activity', 'pp story', 'Unlock the Snap Gun via Yasmani’s Jewelry Jobs in Chapter 3, per PowerPyx. At a jeweler such as Richardson, open the rear entrance with it, find the code and clear the safe without detection; retry another run if spotted.'],
[40, 343, 5, 'activity', 'pp full', 'PowerPyx introduces bank vault jobs through That’s Where The Money Is… in Chapter 4. Follow the guard’s delivery, go in while the vault is open and escape with the haul. The trophy takes five vault jobs; the 100% checklist takes all eight.'],
[41, 344, null, 'activity', 'pp', 'PowerPyx reports the scripted Chapter 4 bank job can count after you escape. If it does not, take an armored truck job in free roam near a Vice City bank and clear the heat after grabbing the cash; opening the truck alone is not enough.'],
[42, 211, 52, 'collectible', 'pp database', 'PSNProfiles tracks 52 areas. PowerPyx recommends unfogging Leonida by air; inspect the map for dark pockets after a broad sweep and make targeted return trips instead of flying the same route twice.'],
[43, 342, 9, 'activity', 'pp full', 'PowerPyx says to use Progress → Gangs to see whose operations you have robbed. Take one from each of the nine gangs for the trophy, then return for outstanding yellow markers: the percentage checklist asks for all 39 operations.'],
[44, 426, null, 'misc', 'pp', 'From the official description, the clue pairs a cocktail with an Ocean Beach view. PowerPyx gives no verified venue or interaction, so leave this for cleanup rather than planning around a specific bar.'],
[45, 427, null, 'misc', 'pp story', 'PowerPyx identifies the blue Banshee at the south Vice City showroom. Bring the Key Cloner from the Chapter 3 introduction, drive that car through the front glass and keep moving while waiting for the unlock.'],
[46, 428, 3, 'misc', 'pp', 'At Kingpin Bowling in Port Gellhorn, PowerPyx identifies a watch in the southeast office, the Gutterball Moreland 850 in the northeast and the safe in the adjoining hall. Leave with all three prizes; the operation can return if you miss something on the first visit.'],
[47, 429, null, 'misc', 'pp', 'PowerPyx interprets the clue as maximizing Strength on both Jason and Lucia at once. After Coffee Break, take your partner to a fitness club so they train alongside you; compare both character sheets before calling the job finished.'],
[48, 430, 500, 'misc', 'pp', 'PowerPyx links the PSNProfiles tally of 500 to actions that affect the criminal profile. Turn on that HUD feedback and watch the trophy counter as you play; the objective does not ask for one particular alignment.'],
[49, 431, null, 'misc', 'pp', 'From the official description, a second attempt seems to matter. PowerPyx has not confirmed an action, mission or lockout, so do not restart your campaign on the strength of the clue.'],
[50, 432, null, 'misc', 'pp', 'From the official description, the only lead is an unexplained event. PowerPyx does not name a verified trigger, so there is no confirmed event or time window to route around.'],
[51, 433, null, 'misc', 'pp', 'From the official description, knock someone over using a melee drive-by in the game. PowerPyx has not confirmed a specific vehicle, weapon or location, so treat those details as unresolved.'],
[52, 437, 250000, 'misc', 'pp story', 'PowerPyx places the Dye Pack Jammer unlock at Credit Check in Chapter 3. Bring marked proceeds from in-game robberies to a fence such as Yasmani in Vice City; the $250,000 target adds deliveries together, so you need not carry it all at once.'],
[53, 438, 100000, 'misc', 'pp', 'PowerPyx treats shop spending as cumulative. Count useful equipment, vehicle work and other purchases toward $100,000 before deliberately spending the balance in post-story cleanup.'],
[54, 435, 8, 'misc', 'pp story', 'After Daily Driver unlocks the real-estate app in Chapter 2, use it to buy eight garage properties, per PowerPyx. The garages given by the story do not stand in for the purchasable ones; buy capacity before working on Scooter Bros.'],
[55, 436, 10, 'misc', 'pp story', 'PowerPyx links the Scooter Bros app to the Chapter 2 introduction to Moses. With sufficient garage space, take vehicles to his Port Gellhorn shop and choose Respray, then Register. Verify ten registrations in the app, not just ten cars driven into storage.'],
];

if (notes.length !== official.trophies.length) throw Error('Annotation count differs from official list.');
const hidden = new Set([2,3,4,5,6,7,8,9,10,11,12,13,22,23,24,26,27,29,37,38,44,45,46,47,48,49,50,51]);
official.trophies = official.trophies.map(({ id, name, description, grade }, index) => {
  const [key, routeOrder, count, kind, references, guide] = notes[index];
  if (key !== id) throw Error('Annotation id mismatch: ' + id);
  const missable = kind === 'missable';
  const missableReason = missable ? 'Balcony session expires with Chapter 1. PowerPyx has not confirmed it is required for the trophy.'
    : kind === 'story' ? 'Automatic campaign award per PowerPyx.'
    : [44,49,50,51].includes(id) ? 'Trigger and timing are unconfirmed; no established cutoff.'
    : 'No permanent cutoff reported in the cited trophy guides.';
  return { id, name, description, grade, hidden: hidden.has(id), kind, missable, missableReason,
    stage: Math.floor(routeOrder / 100), routeOrder, count, guide,
    sources: [...references.split(' '), 'ps'].map(ref => sources[ref]) };
});
writeFileSync(path, JSON.stringify(official, null, 2) + '\n');

// Classic script twin: a direct file:// launch cannot fetch JSON in Chrome.
const atlas = new URL('atlas.js', path);
const dictionary = Object.values(sources);
const records = official.trophies.map(trophy => ({ ...trophy, sources: trophy.sources.map(source => dictionary.indexOf(source)) }));
writeFileSync(atlas, [
  '// Generated from tools/annotate.mjs; classic script for local file launches.',
  `const atlasSources = ${JSON.stringify(dictionary)};`,
  'const atlasTrophies = [',
  ...records.map(record => `  ${JSON.stringify(record)},`),
  '].map(trophy => ({ ...trophy, sources: trophy.sources.map(index => atlasSources[index]) }));',
  '',
].join('\n'));
