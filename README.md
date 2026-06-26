# open-quake (JARVIS Integration Fork)

> **Disclaimer:** open-quake is an independent third-party community project. It is not affiliated with, endorsed by, maintained by, verified by, certified by, or officially supported by DECOKEE. DK-Suite is the official software for DECOKEE Quake. open-quake is not an official open-source version of DK-Suite. Use of open-quake is at your own risk.

This is a customized fork of `open-quake` that integrates the **JARVIS Voice Assistant (Mark-XLVI)** backend, introduces neon cybernetic styling, and implements windowless background startup.

### 💖 Credits & Acknowledgments
This project is built upon the incredible work of two original projects:
*   **[open-quake](https://github.com/TeeJS/open-quake)** by **TeeJS** — the open driver and multi-grid touchscreen launcher for the DK-QUAKE / ARIS-68 device.
*   **[Mark-XLVI](https://github.com/FatihMakes/Mark-XLVI)** by **FatihMakes** — the ultimate cross-platform real-time Gemini voice AI assistant.

A massive thank you to **TeeJS** and **FatihMakes** for making their code and projects open-source!

---

An open driver and touchscreen launcher for the **DK-QUAKE / ARIS-68** — the
1920×480 touchscreen-plus-knob macro device (sold with the closed-source
DK-Suite app). `open-quake` talks to it directly over HID, with no vendor
software running.

![open-quake on the DK-QUAKE](docs/showcase.png)

*From top: the grid launcher · a merged-tile Media grid · the flip-clock app · a [Windy](https://www.windy.com) weather map and a [Home Assistant](https://www.home-assistant.io) dashboard — each with the knob's RGB ring lit a different color.*

### **[⬇ Download Setup / Portable](https://github.com/1dark30-alt/Quake-Jarvis/releases/)** &nbsp;·&nbsp; [Source Code](https://github.com/1dark30-alt/Quake-Jarvis) &nbsp;·&nbsp; or [build from source](docs/building.md)

> **Switching pages:** the panel shows one page at a time — **double-click the knob** to open the page selector, rotate to highlight a page, then press to switch. open-quake shows this tip right on the panel the first time you launch it.

It gives you:

- **A multi-grid launcher** — each page is a grid of tiles; tap a tile — or click it
  with your PC mouse — to open an app, URL, shell command, file, a system action
  (lock screen), or jump to another open-quake page. Icons can be an emoji, the
  program's own icon, or a custom image. → [Editor](docs/editor.md)
- **Web dashboard pages** — a page can be a live web view (Home Assistant, Grafana,
  a status page…) shown full-screen; the knob scrolls, a tap clicks, logins persist,
  with per-page auth (HA token, Basic, custom headers). → [Dashboards](docs/dashboards.md)
- **Knob control** — rotate for volume (or dashboard scroll), single-click to mute,
  **double-click for the page selector**, and **hold to talk** (voice input). The
  knob's **RGB ring** is configurable. → [Settings](docs/settings.md)
- **Bundled apps** — a Flip Clock, a **World Clock** (US time zones or a pick of world
  cities, digital or analog), a **[Music controller](docs/music.md)** (now-playing +
  transport + app grid), a **[System Monitor](docs/system-monitor.md)** (live
  CPU/GPU/RAM/disk/network/battery), and an **[Open WebUI chat](docs/ai-chat.md)** you can
  **talk to by holding the knob**. → [Apps](docs/apps.md)
- **Theming** — a global **light / dark / system** mode and an **accent color** (with savable
  presets) that drives the panel, the bundled apps, and the knob's RGB ring; web dashboards
  follow the light/dark mode, and any page can override the theme in its Advanced settings.
  → [Settings](docs/settings.md)
- **A PC-side editor** — build pages of tiles, merge adjacent tiles into larger buttons,
  drag-and-drop to rearrange, then **Save** to push to the panel. → [Editor](docs/editor.md)
- **Settings** — choose how it launches, **auto-rotate** through pages on a timer, toggle
  the mic, and tune the knob ring; plus a system-tray menu of quick toggles. → [Settings](docs/settings.md)

> **Status:** early but capable. Touch, knob (incl. RGB ring + hold-to-talk), grids, merged
> buttons, web dashboards, the bundled apps (clock / world clock / music / system monitor / AI chat),
> light/dark + accent theming, the on-board mic, and the editor are working and validated against
> real hardware. The panel is
> driven as a normal external monitor (Windows sees a 480×1920 / 1920×480 display); pushing
> frames over the HID resource channel is not implemented.

## 📖 Documentation

Detailed guides live in **[docs/](docs/README.md)**:

- [The editor](docs/editor.md) · [Web dashboards](docs/dashboards.md) · [Bundled apps](docs/apps.md)
- [Music controller](docs/music.md) · [System monitor](docs/system-monitor.md) · [Open WebUI chat + voice](docs/ai-chat.md)
- [Settings & knob lighting](docs/settings.md) · [Building & how it works](docs/building.md) · [Device protocol](docs/DEVICE_PROTOCOL.md)

## Download

Get the installer or portable builds from this fork's **[Releases](https://github.com/1dark30-alt/Quake-Jarvis/releases)** page (Windows x64):
- **[open-quake-0.3.0-portable.exe](https://github.com/1dark30-alt/Quake-Jarvis/releases)** — portable executable (run directly, no installation needed).
- **[open-quake-0.3.0-setup.exe](https://github.com/1dark30-alt/Quake-Jarvis/releases)** — installer setup (creates Start menu shortcuts and includes uninstaller).

For the original unsigned/signed version by the original developer, visit the upstream **[TeeJS/open-quake Releases](https://github.com/TeeJS/open-quake/releases)**.

To launch the app: plug in the DK-QUAKE, then launch the portable or setup executable. The user grid configuration is stored in `%APPDATA%\open-quake`.

## Licensing

Split-licensed — see **[NOTICE](NOTICE)**:

- **MIT** ([LICENSE](LICENSE)) — the launcher and editor (`app/`), original work.
- **PolyForm Noncommercial 1.0.0** ([src/LICENSE](src/LICENSE)) — every file that
  embeds the reverse-engineered protocol: the driver (`src/Aris68Connector.js`),
  the protocol notes (`docs/DEVICE_PROTOCOL.md`), and the two `tools/` scripts.
  The vendor described the comm protocol as restricted for commercial use; these
  files are **non-commercial only** unless you obtain written commercial
  permission from the protocol holders.

No vendor code, binaries, or API keys are included in this repository.

## Safety

`Aris68Connector.js` knows the firmware-download (DFU) command but never sends
it. **Do not call `enterDfu()`** — it puts the device into firmware-flash mode
and can brick it. The write-test in `tools/` only issues read-only query frames.
