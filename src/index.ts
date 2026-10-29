/**
 * Espruino TypeScript Starter App
 * For Waveshare ESP32-S3 e-Paper 1.54" (200x200 monochrome)
 *
 * Controls:
 *   - BOOT button (D0)  : Increment (+1)
 *   - PWR button (D18)  : Decrement (-1)
 *   - Onboard LED (D3)  : Lit while display is refreshing
 */

import { WaveshareEPaper154, EPD_WIDTH, EPD_HEIGHT } from "./epaper";

let epd: WaveshareEPaper154 | null = null;
let counter = 0;
let lastAction = "Ready";
let isRendering = false;
let lastPressTime = 0;

// Persistent 200x200 1-bit monochrome graphics buffer (avoids 5KB heap allocation on every frame)
const g = Graphics.createArrayBuffer(EPD_WIDTH, EPD_HEIGHT, 1, { msb: true });

function drawScreen(): void {
  // White background (1 = white, 0 = black)
  g.setColor(1);
  g.fillRect(0, 0, EPD_WIDTH - 1, EPD_HEIGHT - 1);

  // Outer double border
  g.setColor(0);
  g.drawRect(4, 4, EPD_WIDTH - 5, EPD_HEIGHT - 5);
  g.drawRect(6, 6, EPD_WIDTH - 7, EPD_HEIGHT - 7);

  // Top header banner
  g.fillRect(10, 10, EPD_WIDTH - 11, 36);
  g.setColor(1);
  g.setFont("6x8", 2);
  g.setFontAlign(0, 0);
  g.drawString("UP / DOWN COUNTER", 100, 23);

  // Center counter box
  g.setColor(0);
  g.drawRect(16, 46, 184, 126);
  g.drawRect(18, 48, 182, 124);

  // Big bold counter number
  g.setFont("6x8", 5);
  g.setFontAlign(0, 0);
  g.drawString(String(counter), 100, 86);

  // Status subtitle inside box
  g.setFont("6x8", 1);
  g.drawString(`Status: ${lastAction}`, 100, 114);

  // Button guide legend
  g.setFont("6x8", 1);
  g.drawString("[BOOT] D0  ->  UP (+1)", 100, 142);
  g.drawString("[ PWR] D18 -> DOWN (-1)", 100, 158);

  // Bottom footer
  g.drawString("* ESP32-S3 e-Paper *", 100, 178);
}

function render(fullRefresh: boolean): Promise<void> {
  if (isRendering || !epd) {
    return Promise.resolve();
  }

  isRendering = true;
  digitalWrite(D3, 1); // LED ON while refreshing e-paper

  console.log(`[App] Rendering display (Count: ${counter}, Action: ${lastAction}, Full: ${fullRefresh})...`);

  drawScreen();

  const refreshPromise = fullRefresh
    ? epd.display(g.buffer)
    : epd.displayPartial(g.buffer).catch((err) => {
        console.log("[App] Partial refresh fallback:", err);
        return epd!.display(g.buffer);
      });

  return refreshPromise
    .catch((err) => {
      console.log("[App] Render error:", err);
    })
    .then(() => {
      isRendering = false;
      digitalWrite(D3, 0); // LED OFF when ready
    });
}

function onButton(delta: number, label: string): void {
  if (isRendering) {
    return; // Ignore presses while hardware is busy refreshing
  }

  const now = Date.now();
  if (now - lastPressTime < 400) {
    return; // Debounce guard
  }
  lastPressTime = now;

  counter += delta;
  lastAction = `${label} (Count: ${counter})`;
  console.log(`\n>>> [Button] ${lastAction} <<<`);
  render(false); // Fast partial refresh
}

function setupButtons(): void {
  console.log("[App] Configuring buttons (BOOT=D0, PWR=D18) & LED (D3)...");
  clearWatch();

  // BOOT button (D0) -> UP (+1)
  pinMode(D0, "input_pullup", false);
  setWatch(
    () => {
      onButton(1, "+1");
    },
    D0,
    { repeat: true, edge: "falling", debounce: 120 }
  );

  // PWR button (D18) -> DOWN (-1)
  try {
    pinMode(D18, "input_pullup", false);
    setWatch(
      () => {
        onButton(-1, "-1");
      },
      D18,
      { repeat: true, edge: "falling", debounce: 120 }
    );
  } catch (e) {
    console.log("[App] PWR button watch setup error:", e);
  }

  // Onboard blue status LED (D3)
  try {
    pinMode(D3, "output", false);
    digitalWrite(D3, 0);
  } catch (e) {
    // Ignore
  }
}

function main(): void {
  console.log("=== Starting Waveshare ESP32-S3 e-Paper Starter ===");

  epd = new WaveshareEPaper154();
  epd
    .init()
    .then(() => {
      setupButtons();
      return render(true); // Initial full refresh
    })
    .then(() => {
      console.log("=== Ready! BOOT (D0): +1 | PWR (D18): -1 ===");
    })
    .catch((err) => {
      console.log("[App] Initialization error:", err);
    });
}

// Register Espruino boot lifecycle hook so app starts automatically from .bootcde on power-up
if (typeof global !== "undefined") {
  global.onInit = main;
  global.main = main;
}
if (typeof globalThis !== "undefined") {
  globalThis.onInit = main;
  globalThis.main = main;
}

// Also run immediately upon upload
main();
