# Personal build notes (2026-11-10)

This is a personal, non-distributed copy of the PalmoEMU Web UI (AGPL-3.0-or-later;
bundled cores keep their own licenses — see `LICENSE`, `licenses/`, `NOTICES.md`).
All license and credit files are unchanged from upstream except the dated
addition in `NOTICES.md` describing this build.

## Changes from the stock 0.3.25 tree

1. **GBA core fixed to mGBA Celio** — `src/core/core-registry.js`: the GBA core
   list contains only `mgba` ("mGBA Celio (128 MiB)"). VBA-Next is no longer
   offered for GBA games (it capped at 32 MiB and has no cheat support).
   `tests/rom-capacity.cjs` was updated to assert this new contract; the ROM
   capacity constants and the native-bridge policy checks in that test are
   unchanged.
2. **Delta-style GBA skin as the default** — a new bundled skin
   `bundled:delta-gba` ("Delta Style GBA") under `assets/skins/delta/gba/`,
   registered in `src/skins/bundled-skins.js` and in `BUNDLED_SKINS.json`
   (section `personalSkins`, with SHA-256 hashes; its source `.deltaskin` is in
   `sources/delta-skins/`). The artwork was drawn from scratch for this build
   in the documented Delta skin data format — no Delta/Manic artwork is used.
   `src/skins/skins.js` now defaults GBA games to this skin via
   `defaultSkinId()`; other systems keep `builtin:classic`. Users can still
   pick any other skin per game or per system. `src/updates/offline-plan.js`
   and `src/views/skins.js` were adjusted to use the same default.
   Note: imported-skin artwork is painted over the video layer (as in
   Delta/Manic), so each background image has a transparent window at the
   representation's screen frame.
3. `offline-manifest.js`, `index.html` and `sw.js` build markers were
   regenerated for the changed files (same format as
   `scripts/build-offline.cjs` produces).

Everything else — save states, 1–5x speed, cheats with per-code toggles stored
per game, 128 MiB GBA admission, 16 MiB expanded saves, offline PWA behaviour —
is stock PalmoEMU functionality of the mGBA Celio core and was verified, not
re-implemented.

## How to run

Any static file server works; the bundled one is enough:

```sh
cd palmo-build
node scripts/serve.cjs        # http://127.0.0.1:4173
```

Open the URL in the browser on the device, use "Add to Home Screen" for the
app-like PWA, then import ROMs from the device (「インポート」). ROMs, saves,
states and cheats never leave the device. After the first load the app works
offline.

Do not apply the official PalmoEMU update inside this copy: it would replace
the app with the stock build and drop the changes above.

## 256 MiB GBA ROMs

Not supported, and not a switch in this build. The 128 MiB ceiling exists at
three independent layers (evidence in the tree):

- JS admission: `src/core/rom-capacity.js` (`mgbaMaxROMBytes = 128 MiB`).
- Web bridge: `sources/mgba-web-port/bridge.c` `web_load` / `web_load_owned`
  reject `size > 128 * 1024 * 1024` before allocation.
- Native core (bundled MPL source `sources/mgba-celio-rom64-source.tar.gz`):
  the second ROM window (0x0A000000–0x0BFFFFFF) is bank-switched by a
  four-write key sequence to the bank register (`src/gba/memory.c`,
  "128MiB ROM bank switch (C0_DESIGN.md)"), and the protocol only defines
  banks 1..3 — i.e. 4 × 32 MiB = 128 MiB maximum.

Raising the JS constant alone would still be stopped by the bridge and would
mis-map in the core. Real 256 MiB support would need a new bank protocol in
the C core plus a full Emscripten rebuild of `cores/mgba/mgba.wasm`.

## Update (2026-11-11): fix black screen after the rename update

Since the rename build, the app could open to an almost entirely black
screen: the pending service-worker update staged behind the modal
`dialog.update-progress`, whose `::backdrop` darkened the whole library
(measured ≈90% black), and on the user's device the update never finished
applying, so every launch landed on that black screen. Three fixes in
`src/updates/auto-update.js` (plus one CSS rule in `style.css`):

1. The update indicator is now shown **non-modally** (`show()` instead of
   `showModal()`), so no full-page backdrop is ever painted. Input
   protection is unchanged: the module's capture-phase listener already
   blocks interaction outside the indicator while an update is staged or
   being applied. The dialog gained `z-index`/`box-shadow` in CSS to stay
   visible above the player, and Escape keeps its old dismiss behaviour
   via an explicit keydown handler.
2. **「今は続ける」 (Continue) is offered immediately** when an update is
   staged, instead of appearing only after 60 s — a stalled download is no
   longer a minute-long (or endless) trap.
3. The startup wait for the shared version lock is **bounded to 5 s**
   (AbortController). `app.js` awaits the update manager before the first
   render, so a lock that never arrives (e.g. a suspended page/webview)
   previously meant a permanently black screen; now the app opens without
   the update manager for that visit and `update.html` remains as the
   manual path.

Build markers (`offline-manifest.js`, `index.html` `app-build`, `sw.js`)
were regenerated for the changed files as usual. Verified headlessly:
fresh install renders the library; an old-build profile updates to this
build automatically; while this build stages the next update, the dialog
is non-modal, the library stays at full brightness, and Continue dismisses
it at once. ROMs, saves, states and settings are untouched (no storage,
cache-name or lock-name changes).

## Update (2026-11-10, later): landscape screens + app rename

- **App renamed to 「KDUエミュレーター」** — manifest.webmanifest `name`/`short_name`,
  index.html `<title>`, `apple-mobile-web-app-title`, and the header wordmark.
  Two exact i18n exclusions (scripts/i18n/exclusions.json) record the proper noun as
  locale-invariant. Upstream attribution in NOTICES.md / licenses is unchanged.
- **Landscape GBA screens enlarged** in the Delta Style skin (iPhone variants only;
  portrait and iPad variants untouched). edgeToEdge landscape (844x390 mapping):
  screen 360x240 -> 480x320, controls repositioned around it (D-pad left, A/B right,
  L/R top corners, menu/select/start in the bottom strip). Standard landscape
  (844x352): screen 360x240 -> 432x288 with matching control positions. The two
  landscape background PNGs were re-cut in the original style (same gradient and
  3px-light/2px-dark frame) around the larger windows. skin.json, the source
  .deltaskin (info.json + PNGs), BUNDLED_SKINS.json hashes and the offline
  manifest were regenerated accordingly. Verified headlessly at 844x390
  (displayed game screen measures exactly 480x320 px) and 390x844 portrait
  (unchanged 360x240 layout).
