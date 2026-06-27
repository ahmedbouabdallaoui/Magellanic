# Magellanic — Explore & Expert Mode Redesign

## Overview

Refactor the Explore and Expert modes so both share the same 3D starfield (Three.js) with proximity-based interaction, replacing the current click-to-select and 2D DrawingCanvas approaches. Simplify the nav bar to minimal floating controls.

## 1. Camera & Zoom

- **Current:** `minDistance={20}`, `maxDistance={150}` — prevents close inspection
- **New:** `minDistance={3}`, `maxDistance={200}` — allows zooming in close enough to feel "inside" a constellation
- OrbitControls keep: orbit, zoom, pan disabled
- All animations use delta-time lerp for frame-rate independence

## 2. Proximity Detection (shared by both modes)

A `ProximitySensor` component lives inside the R3F Canvas and runs every frame:

- Tracks camera position via `useThree()`
- Computes each constellation's center point (average of its normalized star positions)
- When camera distance to a constellation center < `threshold` (12 units), fires `onProximity(constellationId)`
- A cooldown prevents re-triggering the same constellation within 5 seconds
- The sensor also tracks which constellation is nearest at all times (for fade effects)

Constellation centers are pre-computed once from normalized star x,y positions (z=0 for all).

## 3. Explore Mode (Normal)

**Starfield mode:** `"explore"`

- Connection lines render with opacity that fades in based on distance: opacity = clamp(1 - distance/40, 0.1, 1.0)
- When `onProximity` fires for a constellation the user hasn't discovered yet:
  - InspectorPanel slides in from the right (existing animation)
  - A "Discovery Badge" popup animates (confetti-like particle burst abstract)
  - `POST /progress/:id/discover` called automatically
  - The badge caption appears: `constellation.discovery_badge_caption`
- When `onProximity` fires for an already-discovered constellation:
  - InspectorPanel slides in without badge popup
- Clicking a star also selects the constellation as fallback
- Closing the panel returns to free exploration
- The panel includes: constellation name, latin name, mythology, area, brightness info, comments section, action buttons (Draw, Bookmark)

## 4. Expert Mode

**Starfield mode:** `"expert"`

- Same 3D starfield view with same camera controls
- Constellation connection lines are **hidden** initially (opacity 0)
- When `onProximity` fires:
  - A prompt appears: "Draw this constellation — click stars in order"
  - Stars that are part of the constellation pulse gently (subtle size oscillation)
- User clicks stars to trace the outline:
  - Correct next star (matches a connection from the last correctly clicked star): green pulse, line segment drawn between them
  - Wrong star: red flash on the clicked star (no score penalty, no cooldown)
  - Clicked stars that later become wrong via backtrack: not allowed (no removing)
- Lines are rendered as Three.js line segments, same style as explore mode lines but colored `#8b7fff` to distinguish from auto-drawn lines
- Completion: when all connection endpoints have been visited:
  - Full constellation lines animate in (explore mode style)
  - Mastery badge overlay appears with `constellation.mastery_badge_caption`
  - `POST /progress/:id/draw` called automatically
  - "Next Constellation" button appears to move to a random un-drawn one
- User can exit back to free-fly at any time by pressing a small "Exit" floating button

## 5. Starfield Component API

```jsx
<Starfield
  constellations={array}       // all constellation objects
  mode={'explore' | 'expert'}  // default: 'explore'
  onProximity={(id) => {}}     // fired when user gets close to a constellation
  onSelect={(id) => {}}        // fired on star click
  onDrawComplete={(id) => {}}  // fired when drawing is finished (expert mode)
  selectedId={string|null}     // currently selected constellation id
/>
```

Internal changes to Starfield:
- `ConstellationMesh` receives `mode` and `selectedId`
- In expert mode: `ConstellationMesh` shows connections only after they are drawn
- A `DrawingController` child component manages the click-to-draw state machine within the Canvas
- Drawing state: `{ constellationId, clickedIndices[], drawnLines[], feedback: { type, starIdx } | null }`

## 6. Nav Bar Replacement

**Before:** Full horizontal bar with Magellanic logo + Explore, Expert, Achievements, Profile(username), Logout links

**After:** Minimal floating controls:
- Top-right corner: "Menu" button (hamburger or "≡") that toggles a small dropdown with: Explore, Expert, Achievements, Profile, Logout
- The dropdown follows the dark galaxy theme (`--surface` background, `--accent` hover)
- The "Magellanic" logo/title is not shown in the nav anymore

## 7. File Changes Summary

| File | Change |
|------|--------|
| `src/components/Starfield.jsx` | Add `mode`, proximity sensor, drawing interaction, fade effects, closer zoom |
| `src/pages/Explore.jsx` | Wire proximity to InspectorPanel auto-popup with discovery badge |
| `src/pages/Expert.jsx` | Use Starfield in expert mode instead of DrawingCanvas |
| `src/components/DrawingCanvas.jsx` | Keep file but it becomes unused (deprecated) |
| `src/components/Layout.jsx` | Replace nav with minimal floating menu button |
| `src/index.css` | Add styles for floating menu, drawing UI overlays, badge anims |

## 8. Implementation Order

1. Starfield: reduce zoom, add `mode` prop, add proximity sensor + `onProximity` callback
2. Starfield: expert mode — drawing interaction (click-to-trace, line rendering, completion)
3. Explore: wire proximity to InspectorPanel auto-popup with discovery badge
4. Expert: use Starfield in expert mode, wire drawing completion
5. Layout: replace nav with floating menu
6. CSS: add new component styles, remove old nav styles

No changes to: backend routes, database schema, seed data, auth, comments, achievements, profile pages.
