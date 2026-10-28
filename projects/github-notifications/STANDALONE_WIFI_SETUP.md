# Standalone Wi-Fi Setup Guide (Waveshare ESP32-S3 e-Paper)

This guide explains how to configure the **Waveshare ESP32-S3 e-Paper (1.54" 200×200)** to run completely standalone on your phone's Wi-Fi hotspot or home Wi-Fi network without requiring a tethered computer.

---

## How It Works

When powered on, the ESP32-S3:
1. Connects directly to your configured Wi-Fi network / phone hotspot using Espruino's built-in `Wifi` module.
2. Periodically sends a lightweight HTTPS POST GraphQL query to `https://api.github.com/graphql`.
3. Checks for:
   - PRs in the **Merge Queue** (`mergeQueue(branch: "main")`) and their position.
   - **Merge Queue kick-outs** (when a PR was in the queue but got dequeued due to CI failure or conflict).
   - **Successful merges** (`state: MERGED`).
   - **New comments** or review status changes (`APPROVED`, `COMMENTED`, etc.).
4. Updates the 200×200 e-paper display with high-contrast status cards via fast partial refreshes (~300ms).
5. Flashes the onboard `D3` LED on alerts (e.g. kicked out of merge queue or merged).

---

## Step 1: Create a GitHub Personal Access Token (PAT)

GitHub's API requires an authenticated token to query private repositories and GraphQL merge queues.

1. Go to **GitHub Settings** > **Developer Settings** > **Personal Access Tokens**.
2. Generate either:
   - **Fine-grained Token:** Repository access: `ImmersiveLabsUkOrg/mittens` with **Pull Requests: Read-only** permission.
   - Or **Classic Token:** Select the `repo` scope.
3. Copy the token string (starts with `github_pat_` or `ghp_`).

---

## Step 2: Configure Your Credentials Locally

Open [`src/config.ts`](src/config.ts) in your local editor (note: this file is gitignored and will never be committed to git):

```typescript
import { AppConfig } from "./config.example";

export const config: AppConfig = {
  wifi: {
    ssid: "YOUR_PHONE_HOTSPOT_NAME", // Exact SSID of your hotspot
    password: "YOUR_HOTSPOT_PASSWORD",
  },
  github: {
    token: "ghp_yourCopiedTokenHere",
    owner: "ImmersiveLabsUkOrg",
    repo: "mittens",
    username: "thisoldbear",
    pollIntervalMs: 45000, // Poll every 45 seconds
  },
};
```

---

## Step 3: Build & Flash to the Board

With your board powered on:

```bash
# Compile TypeScript and upload over Bluetooth Low Energy (BLE)
npm run dev
```

Or over USB:
```bash
npm run build
npm run upload:usb
```

---

## Hardware Controls

- **`BOOT` Button (`D0`):** Force immediate manual sync with GitHub.
- **`PWR` Button (`D18`):** Cycle between your active / recent PRs (displays `(1/3)`, `(2/3)`, etc.).
- **Blue Status LED (`D3`):** 
  - Solid blue while busy refreshing the e-paper display.
  - Flashes 4 times when a PR enters/leaves the merge queue, merges, or receives new comments.
