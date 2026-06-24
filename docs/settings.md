# Settings & knob lighting

The editor's **⚙ Settings** page (top-right) holds the app- and device-level options,
split into a **Software** tab (on launch, screen rotation), a **Hardware** tab (knob
ring, microphone), and a **Theme** tab (light/dark + accent color):

- **On launch** — open the editor window, start **minimized** to the taskbar, or run
  **tray-only** (panel + system tray, no window). open-quake always sits in the system
  tray with quick toggles (mic, knob ring, re-place panel on the device).
- **Screen rotation** — auto-cycle the panel through chosen pages on a timer. Turn it on,
  set the interval (5–3600 s), and pick which **categories** to include (grids, dashboards,
  apps); then tick **Include in rotation** on each page you want in the loop (a page rotates
  only when both its category and its own box are checked). Start or pause it any time from
  the knob's page selector (double-click) or the tray menu.
- **Knob ring** — the RGB ring around the knob. Pick an **effect** (the 44 QMK
  RGB-matrix modes, or *All Off* to turn it off), a **color**, **brightness**, and
  **effect speed**. By default the ring **follows the Theme accent** (below); tick
  **Override theme accent** to set its hue/saturation by hand instead. Changes apply to
  the ring **instantly**; **Save to device** writes them to the device's own memory so
  they persist across power-cycles.
- **Microphone** — the on-board mic's LED lights whenever the mic is enabled (it's a
  single hardware switch). Choose whether it's on at launch, and toggle it any time from
  the tray menu or a **System → mic** tile.
- **Theme** — one global look for everything on the panel:
  - **Appearance** — *System* (follow Windows light/dark), *Light*, or *Dark*. Applies to
    the panel grid, the clocks, and the bundled apps, and is passed to web dashboards as the
    browser light/dark (`prefers-color-scheme`).
  - **Accent color** — a single accent with up to **6 savable presets** (*＋ Save current*
    stores the picker's color, click a preset to apply it, right-click a preset to remove
    it). The accent drives the clock digits/hands, the tile-tap highlight, the music play
    button, and the **knob LED ring**.
  - **Per-page override** — any page can override the global appearance and/or accent for
    just itself, in that page's **Advanced settings** in the editor (e.g. one light page
    while the rest stays dark). Web dashboards follow the global light/dark only.
  - Theme changes apply when you **Save**.

The ring is driven over the device's QMK VIA lighting channel; settings are stored in
`%APPDATA%\open-quake` and re-applied on connect.
