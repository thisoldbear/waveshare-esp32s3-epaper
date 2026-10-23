#!/usr/bin/env bash
set -euo pipefail

# Script to download official Espruino 2v29 binaries for ESP32-S3
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_URL="https://www.espruino.com/binaries/espruino_2v29_esp32s3"

echo "Downloading Espruino ESP32-S3 firmware to ${SCRIPT_DIR}..."
curl -fsSL -o "${SCRIPT_DIR}/bootloader.bin" "${BASE_URL}/bootloader.bin"
curl -fsSL -o "${SCRIPT_DIR}/partition-table.bin" "${BASE_URL}/partition-table.bin"
curl -fsSL -o "${SCRIPT_DIR}/espruino-esp32s3.bin" "${BASE_URL}/espruino-esp32s3.bin"

echo "Espruino firmware binaries downloaded successfully!"
