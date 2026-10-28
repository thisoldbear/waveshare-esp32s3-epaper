# Waveshare ESP32-S3 e-Paper 1.54" Espruino TypeScript Starter

A minimal TypeScript starter for [Espruino](https://www.espruino.com) on the **Waveshare ESP32-S3 e-Paper 1.54" (200×200)** development board.

## What's Included

- **[`src/epaper.ts`](src/epaper.ts)** — SSD1681 200×200 monochrome e-paper driver over software SPI (`D12`/`D13`), supporting:
  - `epd.init()` — Powers on display rail (`D6 = 0`), resets controller, and loads waveform LUT.
  - `epd.display(buffer)` — Clean full refresh (writes both `0x24` and `0x26` RAM planes for zero ghosting).
  - `epd.displayPartial(buffer)` — Fast differential partial refresh (~300ms) with automatic shadow RAM sync.
  - `epd.sleep()` — Puts controller into deep sleep and cuts display power (`D6 = 1`).
- **[`src/index.ts`](src/index.ts)** — Minimal starter app demonstrating:
  - Persistent 5KB 1-bit `Graphics.createArrayBuffer(200, 200, 1, { msb: true })` frame buffer.
  - `BOOT` (`D0`) and `PWR` (`D18`) hardware button watches with debounce and busy-state guards.
  - Onboard `D3` status LED indicator while the display is refreshing.
  - `global.onInit` registration so the board boots straight into your code from flash (`.bootcde`).
- **[`scripts/flash.js`](scripts/flash.js)** — Reliable BLE uploader that writes `dist/app.js` in 512-byte base64 chunks to `.bootcde`, verifies the stored size, and reloads the board.
- **[`src/types.d.ts`](src/types.d.ts)** — TypeScript definitions for ESP32-S3 pins (`D0`–`D18`), GPIO, `setWatch`, and `Graphics`.

---

## Hardware Pinout

| Signal | ESP32-S3 Pin | Function |
| :--- | :--- | :--- |
| **BOOT** | `D0` | Primary button (Active LOW, `input_pullup`) |
| **LED** | `D3` | Onboard blue status LED |
| **PWR (Gate)** | `D6` | Display power switch (**Active LOW**: `0` = ON, `1` = OFF) |
| **BUSY** | `D8` | Display busy output (`1` = busy, `0` = idle) |
| **RST** | `D9` | Display hardware reset |
| **DC** | `D10` | Data/Command select (`0` = command, `1` = data) |
| **CS** | `D11` | SPI Chip Select |
| **SCK** | `D12` | Software SPI Clock |
| **MOSI** | `D13` | Software SPI MOSI |
| **PWR (Btn)** | `D18` | Secondary button (Active LOW, `input_pullup`) |

---

## Getting Started on a New Project

### 1. Branch from `main` & Install Dependencies
```bash
git checkout main
git checkout -b my-new-project
npm install
```

### 2. Edit Your Application (`src/index.ts`)
Draw onto the `Graphics` buffer `g` (`0` = black, `1` = white) and call `epd.display(g.buffer)` for a full refresh or `epd.displayPartial(g.buffer)` for a fast partial update.

### 3. Build & Upload Over BLE
```bash
npm run dev
```
This runs `npm run build` (TypeScript typecheck + `esbuild` bundle into `dist/app.js`) followed by `npm run upload` (`scripts/flash.js`).

To target a different BLE address or serial port:
```bash
ESPRUINO_PORT="your-ble-uuid" npm run upload
# Or upload over USB serial:
npm run upload:usb
```

---

## GitHub PR & Merge Queue Monitor

This project monitors pull requests and merge queue activity for `ImmersiveLabsUkOrg/mittens`:
- **Merge Queue status:** Position in queue and check status (`AWAITING_CHECKS`, `QUEUED`).
- **Kick-outs:** Alerts when a PR was removed/kicked out of the merge queue (due to failed CI or merge conflicts).
- **Merges:** Displays `* MERGED *` upon successful merge.
- **Comments & Reviews:** Tracks new comments and latest review state (`APPROVED`, `COMMENTED`, etc.).

### Option 1: Desktop Companion (Zero-config, Uses your Mac's `gh` credentials)

Run the desktop companion script in a terminal on your Mac:

```bash
npm run monitor
```

It queries GitHub using your existing Mac `gh` CLI session and pushes real-time updates directly to the Waveshare display over BLE or USB.

### Option 2: Standalone Wi-Fi (Untethered Hotspot)

For untethered operation directly on your phone's hotspot or Wi-Fi network, see **[`STANDALONE_WIFI_SETUP.md`](STANDALONE_WIFI_SETUP.md)**.

### Hardware Controls

- **`BOOT` Button (`D0`):** Force immediate sync with GitHub.
- **`PWR` Button (`D18`):** Cycle through your active / recent PRs.
- **Onboard LED (`D3`):** Lit during refresh; flashes on alert events (merge / kick-out / comments).

---

## First-Time Board Setup (Flashing Espruino Firmware)

If preparing a brand-new Waveshare ESP32-S3 e-Paper 1.54" board:

```bash
# 1. (Optional) Backup factory flash over USB
npm run backup

# 2. Download Espruino ESP32-S3 firmware binaries
./firmware/download_firmware.sh

# 3. Flash Espruino firmware to the ESP32-S3
npm run firmware:flash
```
