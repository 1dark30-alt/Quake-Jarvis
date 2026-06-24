# PROJECT — Dashboard button-grid (macro tiles beside a web dashboard)

Let any web-dashboard page on the DK-QUAKE carry an optional native tile grid beside
the live web view — so you can fire macro actions while a dashboard (Home Assistant,
Audiobookshelf, Grafana…) fills the rest of the 1920×480 panel.

## Charter

**1. What is the one thing this must do?**
Show a real, tappable **tile grid alongside a live web dashboard** on the same page —
the tiles run the same actions as a normal grid (app / URL / shell / page / system /
counter / paste), while the dashboard keeps working in the remaining space.

**2. What would be wrong if we shipped "working" software without it?**
**Touch routing must be correct.** Taps in the grid strip launch their tiles; taps in
the dashboard region reach the webview with correctly-offset coordinates; the knob still
scrolls the dashboard. A dashboard with no grid must behave exactly as it does today.

**3. What is explicitly off-limits as a workaround?**
- No injecting a grid into the dashboard's own HTML — that only works for our served
  pages, never third-party sites (HA/ABS/Grafana). It must be a real **native** strip.
- No regressing existing full-screen dashboards (grid off → unchanged).
- No new privileged-webview access; the strip is host-rendered, the webview stays sandboxed.

**4. Deployment target and backup location?**
- Target: bundled into **open-quake** (Windows), shown on the DK-QUAKE panel.
- Backup: the git repo at `D:\Github\open-quake` (snapshots cover it).

**5. How will we verify it's done?**
On the panel:
- A dashboard with a right-aligned 2×2 grid — tiles launch their actions, the dashboard
  still scrolls/taps in its region, and the knob scrolls it.
- Alignment (left/right) and size (1×2 / 2×2 / 3×2) both work.
- A dashboard with the grid disabled is byte-for-byte the old behavior.
- The editor's grid tab edits those tiles (icons included), reusing the normal tile editor.

## Approach (signed off)

- **Data model** — a `kind:'web'` page gains `gridOn`, `gridAlign` (`left`/`right`), and
  reuses the grid schema's `cols`/`rows`/`tiles` (1×2/2×2/3×2 → cols×rows).
- **Editor** — `renderDashboard()` gets an **"Add grid"** checkbox; when on, a 2nd tab holds
  align + size + the tile editor (reusing `renderTiles`/`renderForm`, exactly like the Music
  app's embedded grid at config.js:577).
- **Push** — `resolveGridIcons` resolves the web page's grid tiles' icons (today it returns web
  pages untouched) and passes `gridOn`/align/cols/rows/tiles to the panel.
- **Panel** — when `gridOn`, shrink `#web` to a sub-rect and render the tile strip beside it
  (strip width = cols × square-tile size ≈ cols×240 px on the 480-tall panel). Touch routing in
  `onTouch`: tap in the strip → launch tile; otherwise → `webTouch` with x offset by the strip.
  Knob keeps scrolling the dashboard region.

## Build order (MVP-first)

1. **MVP** — right-aligned 2×2 strip: data flag + "Add grid" checkbox + tile editor reuse +
   panel strip + touch routing. Verify on hardware (layout + routing are the risk).
2. **Options** — alignment (left/right) + size (1×2/2×2/3×2) controls in a 2nd editor tab.
