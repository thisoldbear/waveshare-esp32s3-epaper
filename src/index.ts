/**
 * Espruino TypeScript Up/Down Counter App
 * For Waveshare ESP32-S3 e-Paper 1.54" (200x200)
 *
 * Controls:
 *   - BOOT button (D0)  : Increment (+1)
 *   - PWR button (D18)  : Decrement (-1)
 */

import { WaveshareEPaper154, EPD_WIDTH, EPD_HEIGHT } from "./epaper";

let counter = 0;
let lastAction = "Ready";
let isRefreshing = false;
let pendingRefresh = false;
let epd: WaveshareEPaper154 | null = null;

function render(): Promise<void> {
  if (isRefreshing) {
    pendingRefresh = true;
    return Promise.resolve();
  }

  if (!epd) return Promise.resolve();

  isRefreshing = true;
  pendingRefresh = false;

  console.log(`[App] Rendering display (Count: ${counter}, Action: ${lastAction})...`);

  // Create 200x200 1-bit monochrome graphics buffer
  const g = Graphics.createArrayBuffer(EPD_WIDTH, EPD_HEIGHT, 1, { msb: true });

  // White background
  g.setColor(1);
  g.fillRect(0, 0, EPD_WIDTH - 1, EPD_HEIGHT - 1);

  // Outer border
  g.setColor(0);
  g.drawRect(4, 4, EPD_WIDTH - 5, EPD_HEIGHT - 5);
  g.drawRect(6, 6, EPD_WIDTH - 7, EPD_HEIGHT - 7);

  // Top header banner
  g.fillRect(10, 10, EPD_WIDTH - 11, 36);
  g.setColor(1); // Inverted white text
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

  return epd.display(g.buffer)
    .then(() => {
      console.log(`[App] Screen updated to count: ${counter}`);
    })
    .catch((err) => {
      console.log("[App] Render error:", err);
    })
    .then(() => {
      isRefreshing = false;
      if (pendingRefresh) {
        return render();
      }
    });
}

function flashLed(): void {
  try {
    digitalWrite(D3, 1);
    setTimeout(() => {
      digitalWrite(D3, 0);
    }, 120);
  } catch (e) {
    // LED fallback
  }
}

let lastPressTime = 0;

function onIncrement(): void {
  const now = Date.now();
  if (now - lastPressTime < 500) {
    return; // Ignore duplicate bounce
  }
  lastPressTime = now;

  counter++;
  lastAction = `+1 (Count: ${counter})`;
  console.log(`\n>>> [BOOT Pressed] Incremented -> ${counter} <<<`);
  flashLed();
  render();
}

function onDecrement(): void {
  const now = Date.now();
  if (now - lastPressTime < 500) {
    return; // Ignore duplicate bounce
  }
  lastPressTime = now;

  counter--;
  lastAction = `-1 (Count: ${counter})`;
  console.log(`\n>>> [PWR Pressed] Decremented -> ${counter} <<<`);
  flashLed();
  render();
}

function setupButtons(): void {
  console.log("[App] Clearing old watches & configuring buttons (BOOT=D0, PWR=D18)...");
  clearWatch(); // Remove any duplicate listeners from previous runs

  // BOOT button (D0) -> UP (+1)
  pinMode(D0, "input_pullup", false);
  setWatch(
    () => {
      onIncrement();
    },
    D0,
    { repeat: true, edge: "falling", debounce: 150 }
  );

  // PWR button (D18) -> DOWN (-1)
  try {
    pinMode(D18, "input_pullup", false);
    setWatch(
      () => {
        onDecrement();
      },
      D18,
      { repeat: true, edge: "falling", debounce: 150 }
    );
  } catch (e) {
    console.log("[App] PWR button watch setup error:", e);
  }

  // Setup onboard LED
  try {
    pinMode(D3, "output", false);
    digitalWrite(D3, 0);
  } catch (e) {
    // Ignore
  }

  console.log("[App] Clean button watches established!");
}

function main(): Promise<void> {
  console.log("=== Starting Waveshare ESP32-S3 Up/Down Counter ===");

  epd = new WaveshareEPaper154();

  return epd.init().then(() => {
    setupButtons();
    return render();
  }).then(() => {
    console.log("=== Up/Down Counter Ready! BOOT: (+1), PWR: (-1) ===");
  }).catch((err) => {
    console.log("[App] Initialization error:", err);
  });
}

// Global Espruino lifecycle hook (runs on reboot/power up)
(globalThis as any).onInit = function(): void {
  main();
};

// Also run immediately upon code upload
main();
