#!/usr/bin/env node

/**
 * Local Desktop Companion Monitor for Waveshare ESP32-S3 e-Paper
 *
 * Polls GitHub via the `gh` CLI and pushes updates to the device over BLE or USB Serial.
 */

const espruino = require("espruino");
const { queryGitHub } = require("./github");

const PORT = process.env.ESPRUINO_PORT || "52dc30f4a4c7e590ad4e7cebe78b1320";
const REPO_OWNER = process.env.GITHUB_OWNER || "ImmersiveLabsUkOrg";
const REPO_NAME = process.env.GITHUB_REPO || "mittens";
const USERNAME = process.env.GITHUB_USER || "thisoldbear";
const POLL_INTERVAL_SEC = 30;

async function main() {
  console.log("=== GitHub PR & Merge Queue Desktop Monitor ===");
  console.log(`Target: ${REPO_OWNER}/${REPO_NAME} for user @${USERNAME}`);
  console.log(`Espruino Port/UUID: ${PORT}`);

  await new Promise((resolve) => espruino.init(resolve));

  console.log(`[Monitor] Connecting to Espruino (${PORT})...`);
  await new Promise((resolve, reject) => {
    Espruino.Core.Serial.open(PORT, (status) => {
      if (!status) {
        reject(new Error("Unable to connect to Espruino"));
      } else {
        resolve();
      }
    });
  });

  console.log("[Monitor] Connected to device!");

  function exec(cmd) {
    return new Promise((resolve, reject) => {
      Espruino.Core.Utils.executeExpression(cmd, (res) => {
        if (res === undefined) {
          reject(new Error("Device did not respond (timeout or serial bus busy)"));
        } else if (typeof res === "string" && (res.includes("Error") || res.includes("MEMORY"))) {
          reject(new Error(`Device interpreter error: ${res}`));
        } else {
          resolve(res);
        }
      });
    });
  }

  async function pollAndPush() {
    console.log(`\n[${new Date().toLocaleTimeString()}] Polling GitHub...`);
    const data = queryGitHub();
    if (!data) return;

    const prs = data.user?.pullRequests?.nodes || [];
    const queue = data.repository?.mergeQueue?.entries?.nodes || [];

    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    data.syncTime = `${hh}:${mm}`;

    console.log(`Found ${prs.length} active/recent PRs. Merge queue has ${queue.length} items.`);
    prs.forEach((pr) => {
      console.log(`  - #${pr.number}: ${pr.title} [${pr.state}] (${pr.comments.totalCount} comments)`);
    });

    const b64 = Buffer.from(JSON.stringify(data)).toString("base64");
    const cmd = `globalThis.updatePRData(JSON.parse(atob("${b64}")))`;

    try {
      await exec(cmd);
      console.log("[Monitor] Device display updated successfully.");
    } catch (err) {
      console.error("[Monitor] Failed to push update to device:", err);
    }
  }

  // Sequential polling loop (prevents concurrent UART writes)
  async function pollLoop() {
    await pollAndPush();

    if (process.argv.includes("--once")) {
      console.log("[Monitor] Single update complete. Exiting.");
      process.exit(0);
    }

    setTimeout(pollLoop, POLL_INTERVAL_SEC * 1000);
  }

  await pollLoop();
}

main().catch((err) => {
  console.error("[Monitor] Fatal:", err);
  process.exit(1);
});
