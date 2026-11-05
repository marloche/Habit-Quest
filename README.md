# Habit Quest

A pixel-RPG daily habit tracker. Check off quests and earn XP and gold, level up your hero, and build streaks. It's an installable web app (PWA): it runs full-screen from your iPhone home screen and on your PC, works offline, and needs no App Store.

## How scoring works

| Thing | Rule |
|---|---|
| Full check | 10 XP x momentum, 5 gold |
| Tiny version | 5 XP x momentum, 2 gold, **keeps the streak** |
| Planned quest (Calendar tab) | 10 XP x momentum, 5 gold on its day; missing one costs nothing |
| Momentum | x1.0 to x2.0 = 1 + share of your scheduled checks done in the last 14 days |
| Comeback | x1.5 on the first check after a miss |
| Streak milestones | +50 XP at 7, +150 at 30, +500 at 100 |
| Levels | level L needs 25·L·(L−1) total XP |
| Weekly quests ("3x a week") | streak counts weeks that hit the quota; the first partial week never counts against you |
| Weekly boss | Each boss has its own HP (Slime 120 up to Elder Dragon 1200; each ELITE lap half again). Your hits scale to your week, so the boss falls once you've done a fair share of the week's expected checks: 65% for the first boss, +1% per win, capped at 75%, whether you have 2 quests or 12. Tiny checks hit half, plans hit full as a bonus. The HERO card shows what a check hits for this week. Most fights last a week (Monday to Sunday); the last three are longer: Lich 2 weeks, Demon Lord 3, Elder Dragon 4 (elite laps too). A win pays +50 gold and a chest per week of the fight, and the next boss comes the Monday after. Once even checking everything left can't win, the card says OUT OF REACH. Losing costs nothing: the same boss comes back for a fresh fight. Bosses climb a ladder, one step per win: Slime, Cave Rat, Bat Swarm, Skeleton, Goblin Raider, Orc Brute, Wraith, Dark Knight, Troll, Lich, Demon Lord, Elder Dragon, each bigger and meaner. A lost week brings the same boss back. After the dragon the ladder repeats as glowing ELITE laps The boss idles in its own way, shows wounds at 25 / 50 / 75% damage, flinches when a check hits, and gets knocked out when it falls. |
| Chests | One per week of a won boss fight and per streak milestone: 50-150 gold, or (25%) a chest-only item |
| Achievements | 13 tracks x 3 tiers (HERO > ACHIEVEMENTS), worked out from your history: +25 / +75 / +200 gold per tier. SHOW UP counts different days with any check (30 / 100 / 365); FULL WEEKS counts weeks with a check on all 7 days (4 / 12 / 40); LEGENDS counts finished epic quests (1 / 3 / 10). Every track is a best-ever or a running total, so a missed day never loses a tier; only unticking past days can |
| Wardrobe | HERO > WARDROBE: 47 shop items bought with gold (some need a level) and 4 chest finds, across HAT / ARMOR / WEAPON / CAPE / PET. Four hat + armor sets match: Sea Rover, Valkyrie, Bonewarden and Astral. COLLECTOR III means owning all 51. Weapons are drawn held in the hand. Helmets and hoods hide your hair |
| Trophies | WARDROBE > TROPHY: 14 trophies that can't be bought, 2-3 per slot. Tier II of a track gives an EPIC one (silver name), tier III a LEGENDARY one (gold name), from STREAK, PERFECT, COMEBACK, SHOW UP, FULL WEEKS, TINY HERO and BOSS SLAYER. Locked ones show greyed out with how to earn them. Names use the Jacquarda Bastarda 9 font (OFL, `public/fonts/`) EPIC names have a silver sheen and LEGENDARY names a gold shimmer; earning one plays a full-screen reveal with its own fanfare. |
| Journal | One mood (5 faces) + an optional line per day, in the CALENDAR day panel; the QUEST screen asks "how was today?" in the evening or once all quests are done. +2 gold per day with an entry; clearing the entry takes it back. Stats shows a 30-day mood strip and average mood on all-done days vs other days |
| Focus timer | Give a quest a timer length in its editor (1-180 min) and an hourglass button appears. When it reaches 0 the quest is checked (full) for the day you started it, even if the phone was locked: it finishes when you come back. STOP asks: log the tiny version, discard, or keep going. Minutes focused show on STATS. SETUP can keep the screen on while a timer runs |
| Suggested quests | New saves start empty and open a WELCOME screen: pick goal cards (or type what you want, e.g. "learn spanish"), choose 5 / 15 / 30+ min a day, and get a pre-ticked list from an offline library of about 60 quests. Also under EDIT QUESTS → + SUGGEST QUESTS |
| New game | SETUP → NEW GAME (type RESET) wipes quests, XP, gold, items, journal and focus minutes; settings and your hero's look stay |
| Hero look | HERO → LOOK: 11 class presets (each in its own outfit style), or pick skin, hair style, hair color, outfit style (tunic, robe, leathers, tabard and more) and outfit color yourself (RANDOM HERO too). Level adds armor trim on top: shoulder pads at Knight, gold belt at Champion, glowing eyes at Legend |
| Pets | Tap, click or rub your worn pet on the QUEST screen's top bar or the HERO card: hearts, a move of its own, and its own sound |
| Quest screen | Top bar: your hero (and pet) idling, a LV badge, an XP bar that fills on each check, and gold / perfect days / momentum chips. The boss bar shows the boss idling with its wounds; a hit drops the HP and a gold trail catches up. Quest cards carry a stripe for their state (grey to do, green done, cyan tiny, with a TINY tag), and a check stamps the box with a burst of sparks. ANIMATIONS off stills all of it |
| Epic quests | Long-term goals in their own EPICS tab (G on a keyboard), and always in the gold MAIN QUEST strip under the boss bar on QUEST (with no epic on the road it invites you to start one). Make one from scratch or from EPIC IDEAS (20 offline, 2 per goal) and change every part: name, why, crest icon and color, chapters (up to 12), target date (a missed date just says "no rush") and the guardian boss waiting at the end (AUTO picks one that fits the length). Progress is one of: chapters you tick, checks of linked quests from the epic's start (tiny counts as 1; linked quests show the crest), or an amount you log (km, books, $). The journey map walks your hero from START past a flag per chapter to the guardian. +25 gold per chapter reached, +150 to finish (+50 if finished in under 14 days). Any number can be active, one is MAIN. REST AT INN takes it off QUEST while linked checks keep counting; RETIRE moves it to the HALL with its chapters and gold kept; only an epic that never paid out can be deleted. Finished and retired epics are told in the HALL with dates and a one-line NOTE per chapter. Everything is worked out from the log, so unticking can take a chapter back |
| Sounds | Chiptune made live in code: checks, combos, streaks, level ups, a thump when the boss is hit, its knockout, chest, coin, purchase, EPIC and LEGENDARY fanfares, a voice for each pet, quiet menu taps, epic quest moments (log, chapter, guardian, INN, retire), focus start / last-ten-seconds tick / done chime, and one note per journal mood. SETUP > SOUND: SOUND EFFECTS on/off + volume |
| Music | A chiptune per background scene (13 tunes, written in `src/logic/music.ts`), crossfading when the scene changes. Optional AMBIENCE: rain and thunder, waves and gulls, wind, fire, birds, crickets, chimes. Both start off, each with its own LOW / MEDIUM / HIGH, and pause while the app is hidden |
| Backgrounds | SETUP → DISPLAY: 12 scenes, each with its own animation: castle, dungeon, village, hell, frost pass (snowfall), harbor (bobbing ship, gulls, lighthouse beam), grove (fireflies), desert (heat haze, blowing sand, camels, vulture), aurora (swaying lights mirrored in a lake), dragon lair (sleeping dragon breathing on its hoard), storm (rain and lightning), sky isles (drifting islands and clouds), or PLAIN. AUTO picks a day scene 7:00-19:00 and a night scene otherwise, a different one each day. Strength LOW / MEDIUM / HIGH. Lamps, fires and windows glow and flicker, birds and bats flap across, clouds drift, eyes blink. ANIMATIONS (background, bosses, pets, trophy shine) starts off when the system asks for reduced motion, and turning it on overrides that for those only. Boss art on or off |
| Gold | Spend it on cosmetics in the HERO tab. Earned from checks, bosses, chests, achievements, journal days and epic quests. Balance = earned - paid; unticking past days can put it below zero (you keep your items) |
| New day | starts at 4 AM by default (Setup tab), so late nights count for the day before |

Everything is recalculated from your check-off history, so undoing a check removes exactly what it gave. Any past day can be changed from the Calendar tab, and the scores follow.

## Develop

```bash
npm install
npm run dev        # http://localhost:5173 (no offline mode in dev)
npm test           # game logic unit tests
npm run build      # icons + type check + production build into dist/
npm run preview    # serve dist/ at http://localhost:4173 with the service worker
```

## Deploy to GitHub Pages

The iPhone needs HTTPS for an installable offline app, and GitHub Pages provides it for free.

1. Create a GitHub repo named `Habit-Quest` and push this folder to its `main` branch.
2. In the repo on GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Every push to `main` runs the tests, builds, and deploys. The app ends up at `https://<your-username>.github.io/Habit-Quest/`.

All paths are relative, so it also works under any other repo name.

## Install on iPhone

1. Open the Pages URL in **Safari** (it has to be Safari).
2. Tap **Share → Add to Home Screen → Add**.
3. Open it from the home screen icon. It runs full-screen and works offline from then on.

Notes:
- The home-screen app keeps **its own save**, separate from the Safari tab. Use the home-screen app.
- Sounds start after your first tap (an iOS rule). If the ring/silent switch is on silent, iOS mutes web audio.
- Back up from **Setup → Export save** (on iPhone this opens the share sheet → Save to Files). Restore with **Import save**.
- Updates: after a new deploy, the next launch with internet loads the new version and shows an "Updated!" message. Offline launches keep the last version. The build time is at the bottom of Setup.

## Install on Windows

Open the URL in Chrome or Edge and click the install icon in the address bar (or **⋯ → Apps → Install**). It then gets a Start-menu entry and its own window.

## Daily nudge

No push server is needed. The OS opens the app for you.

**iPhone (Shortcuts app):**
1. Shortcuts → **Automation → + → Time of Day**. Pick a time (e.g. 8:00 PM), Daily, and **Run Immediately**.
2. Add the action **Show Notification** with text like "Quests await, hero!". When it fires, tap the home-screen icon.

Don't use **Open URLs** for this: Shortcuts can't open a home-screen web app, so the link opens Safari, where your save is separate.

**Windows (auto-open):** run once, from this folder:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\install-autostart.ps1          # daily check at 09:30
powershell -ExecutionPolicy Bypass -File scripts\install-autostart.ps1 -At 08:00
```

It registers a Task Scheduler task, **Habit Quest auto-open**, for your user (no admin). The task runs `scripts/open-habit-quest.ps1` at sign-in, on unlock, on wake from sleep and daily at the set time. The script opens the app only if no window titled exactly "Habit Quest" is open. It uses the installed app's Start-menu shortcut if there is one; otherwise it opens a Chrome app window, which shares the same save. To remove it: `Unregister-ScheduledTask -TaskName 'Habit Quest auto-open' -Confirm:$false`.

**Later:** real web push works on iOS 16.4+ for home-screen apps, but it needs a small server to send the pushes. Not built.

## Credits

Font: [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) by CodeMan38, SIL Open Font License (`public/fonts/OFL.txt`). Palette: Sweetie 16 by GrafxKid. All sprites and sounds are made in code in this repo.
