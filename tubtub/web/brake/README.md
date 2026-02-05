# Brake Game Technical Overview

This document explains how the Brake game works, the module structure, and the key systems so a new developer can extend or modify the project confidently.

## 1) High-level architecture

The Brake game is a single-page web game built on Phaser 3. The entrypoint `tubtub/web/brake/main.js` creates a Phaser game and drives the main update loop. Core systems are split into modules:

- `tubtub/web/brake/main.js`: Phaser lifecycle, game state, physics loop, race flow, and map selection.
- `tubtub/web/brake/js/config.js`: Global constants for physics, tuning, and map configs.
- `tubtub/web/brake/js/controls.js`: Player input and bot driving logic.
- `tubtub/web/brake/js/vehicle.js`: Car frame loading and sprite updates.
- `tubtub/web/brake/js/tiled.js`: Tiled map integration and layer queries.
- `tubtub/web/brake/js/maps.js`: Map registry and map selection logic.
- `tubtub/web/brake/js/ui.js`: HUD updates and screen/menu wiring.
- `tubtub/web/brake/index.html`: UI markup + CSS + Phaser script loading.

The game uses:
- Tiled maps (TMJ format) for the racing surfaces.
- Multi-frame car sprites (48 frames per car) for 360-degree rotation.
- HTML UI for menus, HUD, and bot toggle.

## 2) Main loop: lifecycle and update

### 2.1 Phaser lifecycle

`main.js` defines a `gameConfig` with:
- `preload`: load car sprites and Tiled map assets.
- `create`: initialize physics, UI, input, camera, and map.
- `update`: run every frame (movement, drift, collisions, UI updates).

### 2.2 Preload

`preload()` does:
- Load car sprite frames using `loadCarFrames` from `js/vehicle.js`.
- Load each Tiled map JSON and tileset images from `TILEMAPS` in `js/config.js`.

### 2.3 Create

`create()` does:
- Setup world bounds.
- Compute Tiled map availability per map (ensures JSON + tileset images are loaded).
- Initialize UI elements and map cards.
- Create car sprite.
- Register input keys.
- Wire menus and pause overlay.
- Set camera follow + zoom.

### 2.4 Update

`update()` does:
- Swap car sprite frames when player changes car/color.
- Handle pause + restart hotkeys.
- Read controls (player or bot).
- Apply acceleration/braking and friction.
- Apply drift logic and boost.
- Apply on-track/off-track rules (speed caps + drag).
- Update heading, move angle, position.
- Resolve wall collisions (soft pushback).
- Update car sprite frame and HUD.

## 3) Input & bot controls

### 3.1 Player controls

`js/controls.js`:

- `getPlayerControls(cursors)` returns:
  - `throttle`, `reverse`, `handbrake`
  - `driftPressed`, `driftReleased`, `driftHeld`
  - `steer` in range [-1..1]

Controls map to:
- W/S or Up/Down: throttle/reverse
- A/D or Left/Right: steering
- Space: handbrake
- Shift: hop/drift
- R: restart
- Esc: pause

### 3.2 Bot controls

`getBotControls(...)` uses the Tiled drivable layer as a road.
It does not drift. It throttles constantly and steers based on:
- Lookahead ray sampling on the road.
- Road clearance checks (left/right symmetry) to bias toward the center.
- Fallback to nearest road tile if it loses the path.

If bot mode is enabled in the Map Select screen (`#bot-toggle`), the player does not drive and simply watches the bot.

## 4) Vehicle system

`js/vehicle.js`:

- `frameKey(type, color, index)`: unique key for each sprite frame.
- `loadCarFrames(scene, entry, color, frameCount)`: loads frames for a car/color.
- `updateCarFrame(car, scene, heading, entry, color, frameCount)`: selects the correct sprite frame based on heading.
- `swapCar(...)`: ensures frames are loaded and updates the sprite when car/color changes.

Car sprites are 48 frames for full 360 rotation (`FRAME_COUNT` in `config.js`).

## 5) Physics & handling

### 5.1 Base physics

Key values in `js/config.js` under `PHYSICS`:
- `ACCEL_FWD`, `ACCEL_REV`: acceleration rates.
- `GROUND_FRICTION`, `HANDBRAKE_FRICTION`: natural slow and handbrake slow.
- `MAX_SPEED_FWD`, `MAX_SPEED_REV`: currently set to `Infinity`.

Movement:
- Heading changes based on steer and a turn-rate curve.
- Velocity uses a separate `moveAngle` for drift/slip behavior.
- Speed is clamped for on-track/off-track states.

### 5.2 Drift-lite system

Triggered by Shift if:
- Player is moving above `DRIFT_MIN_SPEED`.
- Player is steering.

Behavior:
- In drift, turn rate is boosted (`DRIFT_TURN_BONUS`).
- Movement angle lags behind heading (`DRIFT_ALIGN_RATE`).
- Drift charge accumulates with speed + steer.
- On drift release, a boost is applied based on charge:
  - `DRIFT_BOOST_SMALL`, `DRIFT_BOOST_MED`, `DRIFT_BOOST_LARGE`

While drifting, acceleration and reverse are disabled.

### 5.3 High-speed drag ramp

If speed exceeds `HIGH_SPEED_DRAG_START`, drag ramps up to slow acceleration past that threshold:
- `HIGH_SPEED_DRAG_START`
- `HIGH_SPEED_DRAG`

### 5.4 Off-road drag ramp + cap

Off-road logic uses:
- `OFFTRACK_SPEED_CAP`: max off-road speed.
- `OFFTRACK_FRICTION`: pulls speed down to cap.
- `OFFTRACK_DRAG`: ramps drag above the cap.
- `OFFTRACK_SPEED_RATIO`: cap relative to max speed.

Result: if you go off-road at 800, you gradually slow toward 400 (cap), not instantly.

## 6) Tiled maps

### 6.1 Map registry

`js/config.js` defines `TILEMAPS` with:
- `id`, `name`, `key`, `json`
- `tilesets`: list of tileset names + image paths
- `drivableLayerName` (road), `wallLayerName` (walls)
- optional `objectLayers` (ex: trees)

Maps are stored in:
- `tubtub/web/brake/Assets/Map/stardew`
- `tubtub/web/brake/Assets/Map/willow`

### 6.2 Layer usage

In `js/tiled.js`:
- `drivableLayer` is used for on-road checks.
- `wallLayer` is used for collisions (soft pushback).
- Other tile layers are rendered visually.
- `objectLayers` (like trees) are placed as sprites.

### 6.3 Map selection

`js/maps.js` defines a `MAPS` registry that references `TILEMAPS`.
`getMap()` returns the selected map or a fallback if assets are missing.

## 7) UI & HUD

`index.html` defines screens:
- Splash, Menu, Rules, Character Select, Map Select.

`js/ui.js` manages:
- Screen transitions.
- Car grid and color swatches.
- HUD updates (map name, time, best, speed, drift).

Bot mode is toggled from Map Select (checkbox).

## 8) Race flow

When race starts:
- UI screens hide, HUD shows.
- Map is drawn (Tiled map if available).
- Car is spawned at first road tile or map center.

When race resets:
- Position, speed, drift state reset.
- Best time is saved to localStorage.

## 9) Asset layout

Key folders:
- `tubtub/web/brake/Assets/Map/`: TMJ maps + tilesets.
- `tubtub/web/brake/Assets/cars/`: car sprite frames.
- `tubtub/web/brake/Assets/font/`: fonts for UI.

## 10) Common extension points

### Add a new map
1) Place TMJ + tileset images under `Assets/Map/<mapname>/`.
2) Ensure tileset `image` paths in TMJ are local filenames.
3) Add an entry in `TILEMAPS` in `js/config.js`.
4) Add a map in `js/maps.js`.
5) Add a map card in `index.html`.

### Add AI behaviors
Modify `js/controls.js`:
- Change the lookahead or center bias.
- Add speed control or dynamic braking.

### Add more cars
Add car assets to `Assets/cars/` and register in `js/cars.js`.

## 11) Known constraints / assumptions

- `MAX_SPEED_FWD` and `MAX_SPEED_REV` are `Infinity`. If you want a cap, set these to numeric values.
- The bot uses only the road tile layer, so maps without a `road` layer (or configured `drivableLayerName`) will not work.
- Off-road behavior assumes a single drivable layer; there is no per-tile speed modifier.

## 12) Quick dev checklist

- New map not showing: verify TMJ path + tileset image names.
- Road detection failing: verify `drivableLayerName`.
- Walls not colliding: verify `wallLayerName` and wall tiles exist.
- Bot driving weird: tune lookahead and center bias in `js/controls.js`.
