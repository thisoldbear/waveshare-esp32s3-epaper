/**
 * "The Dark Wood" - Fantasy Dice-Rolling RPG
 * For Waveshare ESP32-S3 e-Paper 1.54" (200x200 monochrome)
 * Built with Preact & TypeScript compiled for Espruino
 */

import { h } from "preact";
import { WaveshareEPaper154, EPD_WIDTH, EPD_HEIGHT } from "./epaper";
import { renderToGraphics } from "./vdom";
import { App } from "./game/components/App";
import { createInitialState, handleInput } from "./game/engine";
import { GameState } from "./game/types";

let epd: WaveshareEPaper154 | null = null;
let state: GameState = createInitialState();
let isRendering = false;
let partialModeActive = false;
let lastPressTime = 0;

function flashLed(): void {
  try {
    digitalWrite(D3, 1);
    setTimeout(() => {
      digitalWrite(D3, 0);
    }, 100);
  } catch (e) {
    // LED fallback
  }
}

function renderDisplay(fullRefresh: boolean): Promise<void> {
  if (isRendering || !epd) {
    return Promise.resolve();
  }
  isRendering = true;

  console.log(
    `[DarkWood] Screen: ${state.screen} | HP: ${state.hp}/${state.maxHp} | Lamps: ${state.lamps}/10 | Full: ${fullRefresh}`
  );

  // Allocate 200x200 monochrome buffer (5000 bytes)
  const g = Graphics.createArrayBuffer(EPD_WIDTH, EPD_HEIGHT, 1, { msb: true });

  // Render Preact component tree directly to Graphics canvas
  const vdomTree = <App state={state} />;
  renderToGraphics(vdomTree, g);

  let refreshPromise: Promise<void>;
  if (fullRefresh || !partialModeActive) {
    refreshPromise = epd
      .display(g.buffer)
      .then(() => {
        return epd!.initPartial();
      })
      .then(() => {
        partialModeActive = true;
      });
  } else {
    // Fast partial refresh (~300ms, zero flash)
    refreshPromise = epd.displayPartial(g.buffer).catch((err) => {
      console.log("[DarkWood] Partial refresh error, falling back to full:", err);
      partialModeActive = false;
      return epd!.display(g.buffer);
    });
  }

  return refreshPromise
    .catch((err) => {
      console.log("[DarkWood] Render error:", err);
    })
    .then(() => {
      isRendering = false;
    });
}

function onButton(button: "BOOT" | "PWR"): void {
  const now = Date.now();
  if (now - lastPressTime < 450) {
    return; // Debounce guard
  }
  lastPressTime = now;

  flashLed();
  console.log(`\n>>> [${button} Pressed] Current Screen: ${state.screen} <<<`);
  const result = handleInput(state, button);
  renderDisplay(result.needsFullRefresh);
}

function setupButtons(): void {
  console.log("[DarkWood] Configuring controls (BOOT=D0, PWR=D18)...");
  clearWatch();

  // BOOT button (D0) -> Primary Action / Strike / Cycle / Start
  pinMode(D0, "input_pullup", false);
  setWatch(
    () => {
      onButton("BOOT");
    },
    D0,
    { repeat: true, edge: "falling", debounce: 120 }
  );

  // PWR button (D18) -> Secondary Action / Select / Flee / Pass
  try {
    pinMode(D18, "input_pullup", false);
    setWatch(
      () => {
        onButton("PWR");
      },
      D18,
      { repeat: true, edge: "falling", debounce: 120 }
    );
  } catch (e) {
    console.log("[DarkWood] Note: PWR button setup notice:", e);
  }

  // Onboard blue LED on D3
  try {
    pinMode(D3, "output", false);
    digitalWrite(D3, 0);
  } catch (e) {
    // LED fallback
  }
}

function main(): void {
  console.log("\n=========================================");
  console.log("   THE DARK WOOD - Dice Rolling RPG");
  console.log("   Waveshare 1.54\" e-Paper + Espruino");
  console.log("=========================================\n");

  state = createInitialState();
  partialModeActive = false;

  epd = new WaveshareEPaper154();
  epd
    .init()
    .then(() => {
      console.log("[DarkWood] Display initialized.");
      setupButtons();
      return renderDisplay(true);
    })
    .then(() => {
      console.log("[DarkWood] Ready! Press [BOOT] or [PWR] to start.");
    })
    .catch((err) => {
      console.log("[DarkWood] Initialization error:", err);
    });
}

// Register for power-on / wake restore
if (typeof global !== "undefined") {
  global.onInit = main;
  global.main = main;
}
if (typeof globalThis !== "undefined") {
  (globalThis as any).onInit = main;
  (globalThis as any).main = main;
}

// Run immediately upon code upload
main();
