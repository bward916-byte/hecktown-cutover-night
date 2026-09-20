# Hecktown Road: Cutover Night
Upgraded Hecktown Road: exploration adventure on the Stairwalk motion rig. No bosses, multi-floor buildings, points, autosave.

- `node build.js`  builds `index.html` from `src/` (manifest order)
- `node tests.js`  headless: every flight both ways, locked doors, full bot playthrough to 100%, save/resume, 10-minute random soak. `SEED=n` varies coworker wandering.
- Map lives in `src/02-map.js` (a stair is one `flight(...)` line, a stair core one `core(...)` line). People, tasks, pages and points live in `src/03-game.js`.
