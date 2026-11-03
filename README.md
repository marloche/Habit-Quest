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
| Weekly boss | HP = 70% of the week's expected checks x 10; full/planned hit 10, tiny 5. Win by Sunday: +50 gold and a chest. Losing costs nothing |
| Chests | One per boss win and per streak milestone: 50-150 gold, or (25%) a chest-only item |
| Achievements | 10 tracks x 3 tiers (HERO > ACHIEVEMENTS), worked out from your history: +25 / +75 / +200 gold per tier. Unticking can lose a tier and its gold. Tier III of STREAK, PERFECT, CHECKS and BOSS SLAYER unlocks a trophy item, wearable only while the tier holds |
| Journal | One mood (5 faces) + an optional line per day, in the CALENDAR day panel; the QUEST screen asks "how was today?" in the evening or once all quests are done. +2 gold per day with an entry; clearing the entry takes it back. Stats shows a 30-day mood strip and average mood on all-done days vs other days |
| Focus timer | Give a quest a timer length in its editor (1-180 min) and an hourglass button appears. When it reaches 0 the quest is checked (full) for the day you started it, even if the phone was locked: it finishes when you come back. STOP asks: log the tiny version, discard, or keep going. Minutes focused show on STATS. SETUP can keep the screen on while a timer runs |
| Gold | Spend it on cosmetics in the HERO tab. Balance = earned - paid; unticking past days can put it below zero (you keep your items) |
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

**Windows (open at login):**
1. Install the app from Chrome or Edge (above).
2. Press `Win + R`, type `shell:startup`, Enter.
3. Right-click the installed app's shortcut in the Start menu → **Open file location**, and copy that shortcut into the Startup folder.

Or use Task Scheduler for a fixed time: **Create Basic Task → Daily → Start a program** → your browser's exe with the app URL as the argument.

**Later:** real web push works on iOS 16.4+ for home-screen apps, but it needs a small server to send the pushes. Not built.

## Credits

Font: [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) by CodeMan38, SIL Open Font License (`public/fonts/OFL.txt`). Palette: Sweetie 16 by GrafxKid. All sprites and sounds are made in code in this repo.
