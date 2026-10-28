# Waveshare ESP32-S3 e-Paper 1.54" Platform

A modular TypeScript platform and hardware driver for [Espruino](https://www.espruino.com) on the **Waveshare ESP32-S3 e-Paper 1.54" (200×200)** development board.

The repository is organized into a **neutral core** and independent **project folders**:
- **`src/`**: Shared hardware abstraction (`epaper.ts`), Espruino type definitions (`types.d.ts`), and a neutral baseline hardware starter app (`src/index.ts`).
- **`projects/`**: Self-contained applications (e.g. `projects/github-notifications/`), each with their own firmware, tests, and companion scripts.

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

## Projects

### 1. Neutral Starter (`starter`)
A simple counter and button test app that validates hardware buttons and e-paper display refresh.
```bash
# Build & flash default starter
npm run build
npm run upload
# Or build + flash in one step:
npm run dev
```

### 2. GitHub PR & Merge Queue Monitor (`github-notifications`)
Located in [`projects/github-notifications/`](projects/github-notifications/). Monitors pull requests, review states, new comments, merges, and merge queue entry/kick-out events for user `thisoldbear` on repo `ImmersiveLabsUkOrg/mittens`.

```bash
# Build & flash to board
npm run dev:github

# Run the Mac companion monitor daemon (polls via gh CLI over BLE/Serial)
npm run monitor

# Run unit tests
npm test
```
See [`projects/github-notifications/README.md`](projects/github-notifications/README.md) for full documentation.

---

## Creating a New Project

To add a new project without modifying the root starter:

1. Create a new folder: `mkdir -p projects/my-app/src`
2. Create `projects/my-app/src/index.ts` importing the shared driver:
   ```ts
   import { WaveshareEPaper154, EPD_WIDTH, EPD_HEIGHT } from "../../../src/epaper";
   ```
3. Build and flash:
   ```bash
   node scripts/build.js my-app
   npm run upload
   ```

---

## Flashing & Hardware Targets

To specify a custom BLE UUID or USB serial port:
```bash
# Target custom BLE device
ESPRUINO_PORT="52dc30f4a4c7e590ad4e7cebe78b1320" npm run upload

# Flash over USB serial directly
npm run upload:usb
```

---

## First-Time Board Setup (Flashing Espruino Firmware)

If preparing a brand-new Waveshare ESP32-S3 e-Paper 1.54" board:

```bash
# 1. (Optional) Backup factory flash over USB
npm run backup

# 2. Download official Espruino 2v29 binaries
./firmware/download_firmware.sh

# 3. Flash Espruino firmware to the ESP32-S3
npm run firmware:flash
```
