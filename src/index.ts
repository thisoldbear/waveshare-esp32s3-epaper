/**
 * Waveshare ESP32-S3 e-Paper 1.54" GitHub PR & Merge Queue Monitor
 *
 * Tracks:
 *   - Merge Queue entry, position, and status (e.g. Awaiting checks)
 *   - Merge Queue kick-outs (CI failures or merge conflicts)
 *   - PR successful merge events
 *   - New comments & review status changes
 *
 * Controls:
 *   - BOOT button (D0) : Force manual sync with GitHub
 *   - PWR button (D18) : Cycle to next PR in list
 *   - LED (D3)         : Solid while busy, flashes on alerts (merge / kick-out)
 */

import { WaveshareEPaper154, EPD_WIDTH, EPD_HEIGHT } from "./epaper";
import { config } from "./config";


export interface PRItem {
  number: number;
  title: string;
  state: "OPEN" | "MERGED" | "CLOSED";
  mergedAt: string | null;
  commentCount: number;
  latestReview: string | null;
  queuePosition: number | null;
  queueState: string | null;
  kickedOut: boolean;
  hasNewComment: boolean;
}

let epd: WaveshareEPaper154 | null = null;
let isRendering = false;
let lastPressTime = 0;
let refreshCounter = 0;

// App State
let wifiConnected = false;
let wifiStatus = "INIT";
let lastSyncTime = "--:--";
let lastError: string | null = null;
let prList: PRItem[] = [];
let selectedIndex = 0;
let previousQueuePrs: Record<number, boolean> = {};
let isPolling = false;
let autoCycleTimer: any = null;
const AUTO_CYCLE_INTERVAL_MS = 15000; // Auto-cycle to next PR every 15 seconds

function resetAutoCycle(): void {
  if (autoCycleTimer) {
    clearInterval(autoCycleTimer);
    autoCycleTimer = null;
  }
  autoCycleTimer = setInterval(() => {
    if (prList.length > 1 && !isRendering) {
      selectedIndex = (selectedIndex + 1) % prList.length;
      console.log(`[AutoCycle] Rotating to PR index ${selectedIndex} (#${prList[selectedIndex].number})`);
      render(false);
    }
  }, AUTO_CYCLE_INTERVAL_MS);
}

// Persistent 200x200 1-bit monochrome graphics buffer
const g = Graphics.createArrayBuffer(EPD_WIDTH, EPD_HEIGHT, 1, { msb: true });

function formatTime(date: Date): string {
  const h = date.getHours();
  const m = date.getMinutes();
  const hh = h < 10 ? "0" + h : "" + h;
  const mm = m < 10 ? "0" + m : "" + m;
  return hh + ":" + mm;
}

function wrapText(text: string, maxLen: number, maxLines: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if ((current ? current + " " + word : word).length <= maxLen) {
      current = current ? current + " " + word : word;
    } else {
      if (current) lines.push(current);
      current = word;
      if (lines.length >= maxLines - 1) break;
    }
  }
  if (current && lines.length < maxLines) {
    lines.push(current);
  }
  return lines;
}

function flashLed(times: number, intervalMs?: number): void {
  const delay = intervalMs || 120;
  try {
    let count = 0;
    const timer = setInterval(() => {
      digitalWrite(D3, count % 2 === 0 ? 1 : 0);
      count++;
      if (count >= times * 2) {
        clearInterval(timer);
        digitalWrite(D3, 0);
      }
    }, delay);
  } catch (e) {
    // Ignore LED errors
  }
}

function drawScreen(): void {
  // Clear to white background (1 = white, 0 = black)
  g.setColor(1);
  g.fillRect(0, 0, EPD_WIDTH - 1, EPD_HEIGHT - 1);

  // Outer border
  g.setColor(0);
  g.drawRect(0, 0, EPD_WIDTH - 1, EPD_HEIGHT - 1);

  // 1. Top Header Banner
  g.fillRect(0, 0, EPD_WIDTH - 1, 20);
  g.setColor(1);
  g.setFont("6x8", 1);
  g.setFontAlign(-1, 0);
  g.drawString(config.github.repo, 6, 10);

  // If no PRs loaded yet
  if (prList.length === 0) {
    g.setColor(0);
    g.setFont("6x8", 2);
    g.setFontAlign(0, 0);
    g.drawString("GITHUB PR", 100, 60);
    g.drawString("MONITOR", 100, 80);

    g.setFont("6x8", 1);
    g.drawString(`User: ${config.github.username}`, 100, 115);
    if (lastError) {
      g.drawString(`Err: ${lastError.substring(0, 24)}`, 100, 135);
    } else {
      g.drawString("Waiting for updates...", 100, 135);
    }

    g.setFontAlign(0, 0);
    g.drawString("[BOOT] Sync now", 100, 180);
    return;
  }

  const pr = prList[selectedIndex % prList.length];

  // 2. PR Number & Index Sub-header
  g.setColor(0);
  g.setFont("6x8", 2);
  g.setFontAlign(-1, 0);
  g.drawString(`#${pr.number}`, 8, 32);

  g.setFont("6x8", 1);
  g.setFontAlign(1, 0);
  g.drawString(`(${selectedIndex + 1}/${prList.length})`, EPD_WIDTH - 8, 32);

  // 3. Status Badge Box
  if (pr.kickedOut) {
    // Alert: Kicked out from Merge Queue
    g.setColor(0);
    g.drawRect(6, 44, EPD_WIDTH - 7, 82);
    g.drawRect(8, 46, EPD_WIDTH - 9, 80);
    g.setFont("6x8", 2);
    g.setFontAlign(0, 0);
    g.drawString("! KICKED OUT !", 100, 58);
    g.setFont("6x8", 1);
    g.drawString("Removed from Queue", 100, 72);
  } else if (pr.queuePosition !== null) {
    // In Merge Queue
    g.setColor(0);
    g.fillRect(6, 44, EPD_WIDTH - 7, 82);
    g.setColor(1);
    g.setFont("6x8", 2);
    g.setFontAlign(0, 0);
    g.drawString(`QUEUE #${pr.queuePosition}`, 100, 58);
    g.setFont("6x8", 1);
    g.drawString(pr.queueState || "IN PROGRESS", 100, 72);
  } else if (pr.state === "MERGED") {
    // Merged
    g.setColor(0);
    g.fillRect(6, 44, EPD_WIDTH - 7, 82);
    g.setColor(1);
    g.setFont("6x8", 2);
    g.setFontAlign(0, 0);
    g.drawString("* MERGED *", 100, 58);
    g.setFont("6x8", 1);
    g.drawString("Successfully merged!", 100, 72);
  } else {
    // Open PR
    g.setColor(0);
    g.drawRect(6, 44, EPD_WIDTH - 7, 82);
    g.setFont("6x8", 2);
    g.setFontAlign(0, 0);
    g.drawString("OPEN PR", 100, 58);
    g.setFont("6x8", 1);
    const rev = pr.latestReview ? `Review: ${pr.latestReview}` : "Review: Pending";
    g.drawString(rev, 100, 72);
  }

  // 4. PR Title Box (Wrapped 2-3 lines)
  g.setColor(0);
  g.setFont("6x8", 1);
  g.setFontAlign(-1, -1);
  const titleLines = wrapText(pr.title, 30, 3);
  let titleY = 90;
  for (let i = 0; i < titleLines.length; i++) {
    g.drawString(titleLines[i], 8, titleY);
    titleY += 11;
  }

  // Divider line
  g.drawLine(6, 130, EPD_WIDTH - 7, 130);

  // 5. Activity Details
  g.setFont("6x8", 1);
  g.setFontAlign(-1, 0);
  const commentTag = pr.hasNewComment ? `[NEW!] Comments: ${pr.commentCount}` : `Comments: ${pr.commentCount}`;
  g.drawString(commentTag, 8, 142);

  const reviewTag = pr.latestReview ? `Review: ${pr.latestReview}` : "Review: Pending";
  g.drawString(reviewTag, 8, 156);

  if (lastError) {
    g.drawString(`Warn: ${lastError.substring(0, 24)}`, 8, 170);
  } else {
    g.drawString(`Author: @${config.github.username}`, 8, 170);
  }

  // 6. Bottom Button Guide Footer
  g.fillRect(0, 182, EPD_WIDTH - 1, EPD_HEIGHT - 1);
  g.setColor(1);
  g.setFont("6x8", 1);
  g.setFontAlign(0, 0);
  g.drawString("[BOOT] Sync   [PWR] Next", 100, 191);
}

function render(fullRefresh: boolean): Promise<void> {
  if (isRendering || !epd) {
    return Promise.resolve();
  }

  isRendering = true;

  drawScreen();

  const refreshPromise = fullRefresh
    ? epd.display(g.buffer)
    : epd.displayPartial(g.buffer).catch((err) => {
        console.log("[App] Partial fallback to full:", err);
        return epd!.display(g.buffer);
      });

  return refreshPromise
    .catch((err) => {
      console.log("[App] Render error:", err);
    })
    .then(() => {
      isRendering = false;
    });
}

function processGraphQLData(data: any): boolean {
  if (!data) return false;

  const queueMap: Record<number, { position: number; state: string }> = {};
  const currentQueueSet: Record<number, boolean> = {};

  // Parse Merge Queue entries
  const queueEntries = data.repository?.mergeQueue?.entries?.nodes || [];
  for (let i = 0; i < queueEntries.length; i++) {
    const entry = queueEntries[i];
    const prNum = entry.pullRequest?.number;
    if (prNum) {
      queueMap[prNum] = {
        position: entry.position,
        state: entry.state,
      };
      if (entry.pullRequest?.author?.login === config.github.username) {
        currentQueueSet[prNum] = true;
      }
    }
  }

  // Parse User Pull Requests
  const rawPRs = data.user?.pullRequests?.nodes || [];
  const updatedList: PRItem[] = [];
  let alertTriggered = false;

  for (let i = 0; i < rawPRs.length; i++) {
    const raw = rawPRs[i];
    const num = raw.number;
    const inQueue = queueMap[num];
    const wasInQueue = !!previousQueuePrs[num];

    let prevItem: PRItem | null = null;
    for (let j = 0; j < prList.length; j++) {
      if (prList[j].number === num) {
        prevItem = prList[j];
        break;
      }
    }
    const prevCommentCount = prevItem ? prevItem.commentCount : raw.comments?.totalCount || 0;
    const hasNewComment = raw.comments?.totalCount > prevCommentCount;

    // Detect kicked out from queue: was previously in queue, now not, and NOT merged
    const kickedOut = wasInQueue && !inQueue && raw.state !== "MERGED";

    if (kickedOut) {
      console.log(`[Alert] PR #${num} was KICKED OUT of the merge queue!`);
      alertTriggered = true;
    }

    if (inQueue && !wasInQueue) {
      console.log(`[Alert] PR #${num} ENTERED merge queue at pos #${inQueue.position}!`);
      alertTriggered = true;
    }

    if (raw.state === "MERGED" && prevItem && prevItem.state !== "MERGED") {
      console.log(`[Alert] PR #${num} has MERGED!`);
      alertTriggered = true;
    }

    if (hasNewComment) {
      console.log(`[Alert] PR #${num} received a NEW COMMENT!`);
      alertTriggered = true;
    }

    const item: PRItem = {
      number: num,
      title: raw.title || `PR #${num}`,
      state: raw.state,
      mergedAt: raw.mergedAt,
      commentCount: raw.comments?.totalCount || 0,
      latestReview: raw.reviews?.nodes?.[0]?.state || null,
      queuePosition: inQueue ? inQueue.position : null,
      queueState: inQueue ? inQueue.state : null,
      kickedOut,
      hasNewComment,
    };

    updatedList.push(item);
  }

  previousQueuePrs = currentQueueSet;
  prList = updatedList;
  lastSyncTime = data.syncTime || formatTime(new Date());
  lastError = null;

  if (alertTriggered) {
    flashLed(4, 100);
  }

  resetAutoCycle();
  return true;
}

function fetchGitHubData(): Promise<void> {
  if (isPolling) {
    return Promise.resolve();
  }
  isPolling = true;

  return new Promise<void>((resolve, reject) => {
    const http = require("http");

    const query = JSON.stringify({
      query: `query{repository(owner:"${config.github.owner}",name:"${config.github.repo}"){mergeQueue(branch:"main"){entries(first:5){nodes{position state pullRequest{number author{login}}}}}}user(login:"${config.github.username}"){pullRequests(first:3,states:[OPEN,MERGED],orderBy:{field:UPDATED_AT,direction:DESC}){nodes{number title state mergedAt comments{totalCount}reviews(last:1){nodes{state author{login}}}}}}}`,
    });

    const options: HttpRequestOptions = {
      host: "api.github.com",
      port: 443,
      path: "/graphql",
      method: "POST",
      protocol: "https:",
      headers: {
        "User-Agent": "Espruino-Waveshare",
        Authorization: "bearer " + config.github.token,
        "Content-Type": "application/json",
        "Content-Length": query.length,
      },
    };

    console.log("[GitHub] Sending GraphQL query...");
    digitalWrite(D3, 1);

    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk: string) => {
        body += chunk;
      });

      res.on("close", () => {
        digitalWrite(D3, 0);
        isPolling = false;
        console.log(`[GitHub] Response received (${body.length} bytes). Status: ${res.statusCode}`);

        try {
          const json = JSON.parse(body);
          if (json.errors) {
            lastError = json.errors[0]?.message || "GraphQL error";
            console.log("[GitHub] Error:", lastError);
            render(false);
            reject(new Error(lastError!));
            return;
          }

          processGraphQLData(json.data);
          render(false);
          resolve();
        } catch (e: any) {
          lastError = "Parse err";
          console.log("[GitHub] JSON parse error:", e);
          render(false);
          reject(e);
        }
      });
    });

    req.on("error", (err) => {
      digitalWrite(D3, 0);
      isPolling = false;
      lastError = "Net err";
      console.log("[GitHub] Network error:", err);
      render(false);
      reject(err);
    });

    req.write(query);
    req.end();
  });
}

function connectWifi(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const wifi = require("Wifi");
    wifiStatus = "Connecting...";
    console.log(`[WiFi] Connecting to "${config.wifi.ssid}"...`);
    render(false);

    wifi.connect(config.wifi.ssid, { password: config.wifi.password }, (err) => {
      if (err) {
        wifiConnected = false;
        wifiStatus = "Fail";
        lastError = "WiFi connect fail";
        console.log("[WiFi] Connection failed:", err);
        render(false);
        reject(new Error(String(err)));
      } else {
        wifiConnected = true;
        wifiStatus = "OK";
        console.log("[WiFi] Connected! IP:", wifi.getIP().ip);
        render(false);
        resolve();
      }
    });
  });
}

function isWifiConfigured(): boolean {
  return (
    !!config.wifi.ssid &&
    config.wifi.ssid !== "YOUR_HOTSPOT_SSID" &&
    config.wifi.ssid !== "YOUR_WIFI_SSID" &&
    config.wifi.ssid.trim().length > 0
  );
}

function onButton(action: "NEXT_PR" | "SYNC"): void {
  if (isRendering) return;
  const now = Date.now();
  if (now - lastPressTime < 400) return;
  lastPressTime = now;

  if (action === "NEXT_PR") {
    if (prList.length > 0) {
      selectedIndex = (selectedIndex + 1) % prList.length;
      console.log(`[UI] Switched to PR index ${selectedIndex} (#${prList[selectedIndex].number})`);
      resetAutoCycle();
      render(false);
    }
  } else if (action === "SYNC") {
    console.log("[UI] Manual sync requested via BOOT button...");
    if (isWifiConfigured()) {
      if (wifiConnected) {
        fetchGitHubData().catch(() => {});
      } else {
        connectWifi()
          .then(() => fetchGitHubData())
          .catch(() => {});
      }
    } else {
      console.log("[UI] Standalone Wi-Fi not configured. Push updates via desktop monitor.");
    }
  }
}

function setupButtons(): void {
  console.log("[App] Configuring hardware buttons (BOOT=D0, PWR=D18)...");
  clearWatch();

  // BOOT button (D0) -> Manual Sync
  pinMode(D0, "input_pullup", false);
  setWatch(() => onButton("SYNC"), D0, { repeat: true, edge: "falling", debounce: 120 });

  // PWR button (D18) -> Next PR
  try {
    pinMode(D18, "input_pullup", false);
    setWatch(() => onButton("NEXT_PR"), D18, { repeat: true, edge: "falling", debounce: 120 });
  } catch (e) {
    console.log("[App] PWR button watch setup error:", e);
  }

  // LED pin
  try {
    pinMode(D3, "output", false);
    digitalWrite(D3, 0);
  } catch (e) {}
}

function startSyncLoop(): void {
  console.log(`[App] Starting sync loop (every ${config.github.pollIntervalMs / 1000}s)...`);
  setInterval(() => {
    if (wifiConnected) {
      fetchGitHubData().catch((err) => {
        console.log("[SyncLoop] Poll error:", err);
      });
    } else {
      connectWifi()
        .then(() => fetchGitHubData())
        .catch(() => {});
    }
  }, config.github.pollIntervalMs);
}

function main(): void {
  console.log("=== Waveshare ESP32-S3 GitHub Notifications Monitor ===");

  epd = new WaveshareEPaper154();
  epd
    .init()
    .then(() => {
      setupButtons();
      return render(true); // Initial full refresh
    })
    .then(() => {
      if (!isWifiConfigured()) {
        console.log("[App] Wi-Fi not configured; running in Desktop Companion mode.");
        return;
      }
      console.log("[App] Initializing Wi-Fi...");
      return connectWifi()
        .then(() => {
          console.log("[App] Fetching initial GitHub status...");
          return fetchGitHubData();
        })
        .then(() => {
          startSyncLoop();
        })
        .catch((err) => {
          console.log("[App] Boot sequence warning/error:", err);
          // Even if Wi-Fi initial connect fails, start the periodic retry loop
          startSyncLoop();
        });
    })
    .catch((err) => {
      console.log("[App] Initialization error:", err);
    });
}

let hasDoneInitialRender = false;

// Global hook for REPL/USB update injection
(globalThis as any).updatePRData = function (rawJson: any) {
  processGraphQLData(rawJson);
  resetAutoCycle();
  if (!hasDoneInitialRender) {
    hasDoneInitialRender = true;
    render(true); // Clean full refresh once to wipe panel clean of any ghost pixels
  } else {
    render(false);
  }
};

if (typeof global !== "undefined") {
  global.onInit = main;
  global.main = main;
}
if (typeof globalThis !== "undefined") {
  (globalThis as any).onInit = main;
  (globalThis as any).main = main;
}

main();
