# GitHub PR & Merge Queue Monitor

A live status monitor for the Waveshare ESP32-S3 1.54" e-Paper display.

Tracks pull requests, review states, new comments, successful merges (`state: MERGED`), entry into the GitHub merge queue with queue position, and merge queue kick-out events for user `thisoldbear` on repository `ImmersiveLabsUkOrg/mittens`.

---

## Operational Modes

### 1. Desktop Companion Mode (Recommended)
Streams live updates from your Mac to the board over Bluetooth LE or USB Serial using your local `gh` CLI credentials (no tokens or passwords committed or transferred).

```bash
# 1. Build and flash the project to your board
npm run dev:github

# 2. Run the companion daemon in your terminal
npm run monitor
```

The monitor polls GitHub GraphQL every 30 seconds and pushes fresh PR data to the board. The board auto-cycles through active PRs every 15 seconds with quiet, partial refreshes.

### 2. Standalone Wi-Fi Mode
Allows the board to run untethered anywhere by connecting directly to Wi-Fi / mobile hotspot.

See [`STANDALONE_WIFI_SETUP.md`](./STANDALONE_WIFI_SETUP.md) for full configuration steps.

---

## Hardware Controls
- **BOOT Button (`D0`):** Force manual sync.
- **PWR Button (`D18`):** Cycle to next PR in list immediately.
- **LED (`D3`):** Flashes on alerts (PR merged, new comment, entered or kicked out of merge queue).

---

## Testing
Run unit tests for the state machine:
```bash
npm test
```
