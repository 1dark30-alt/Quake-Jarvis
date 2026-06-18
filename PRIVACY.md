# Privacy Policy — open-quake

_Last updated: 2026-06-18_

open-quake is a free, open-source Windows desktop application and driver for the
**DK-QUAKE / ARIS-68** touchscreen-and-knob macro device. This policy explains what
data the app does and does not handle.

## The short version

**open-quake does not collect, transmit, sell, or share any personal data.** It has no
analytics, no telemetry, no advertising, no user accounts, and makes no network
connections to the developer. Everything it stores stays on your own PC.

## What is stored, and where

open-quake saves its configuration locally on your computer under
`%APPDATA%\open-quake` (for example `C:\Users\<you>\AppData\Roaming\open-quake`). This
includes your page layouts, tiles, app settings, and any URLs or credentials you choose
to enter for your own web-dashboard pages. **This data never leaves your device** through
any action of open-quake, and the developer never receives it.

## Web dashboard pages

open-quake can display web pages that you configure (for example Home Assistant,
Grafana, or a weather map) inside an embedded browser view. When you do this, you are
connecting to those third-party websites directly, and your use of them is governed by
**their** privacy policies, not this one. Any access tokens, passwords, or headers you
enter for a dashboard are stored locally and are sent only to the website you configured
them for.

## The device (USB and microphone)

open-quake communicates with the DK-QUAKE over USB (HID) to handle touch input, the
knob, the ring lighting, and to switch the device's microphone on or off. **open-quake
does not record, capture, or transmit audio.** The device's microphone is a standard USB
audio input that any application can use; open-quake itself does not read from it.

## Children

open-quake is a general-purpose utility and is not directed at children.

## Changes to this policy

If this policy changes, the updated version will be posted at this URL with a new
"last updated" date.

## Contact

Questions about this policy? Open an issue at
<https://github.com/TeeJS/open-quake/issues> or email **teejschmitz@gmail.com**.
