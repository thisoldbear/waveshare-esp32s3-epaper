# Waveshare ESP32-S3 e-Paper 1.54" Espruino TypeScript App

A TypeScript application running on [Espruino](https://www.espruino.com) for the **Waveshare ESP32-S3 e-Paper 1.54"** development board.

## Hardware Pinout

| Signal | ESP32-S3 Pin | Function |
| :--- | :--- | :--- |
| **PWR** | `D6` | Power switch for display rail (Active HIGH) |
| **BUSY** | `D8` | Busy output from display (HIGH: busy, LOW: idle) |
| **RST** | `D9` | Hardware reset |
| **DC** | `D10` | Data/Command selector (0: command, 1: data) |
| **CS** | `D11` | SPI Chip Select |
| **SCK** | `D12` | SPI Clock |
| **MOSI** | `D13` | SPI MOSI |

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Download Espruino Firmware
```bash
./firmware/download_firmware.sh
```

### 3. Flash Espruino Firmware to ESP32-S3
```bash
npm run firmware:flash
```

### 4. Build TypeScript App
```bash
npm run build
```

### 5. Upload to Device
```bash
npm run upload
```
Or build and upload in a single command:
```bash
npm run dev
```
