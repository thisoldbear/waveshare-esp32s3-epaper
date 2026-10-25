import { h, renderToGraphics } from "../../src/vdom";
import { App } from "../../src/game/components/App";
import { createInitialState, handleInput } from "../../src/game/engine";
import { GameState } from "../../src/game/types";
import { WebGraphics } from "./WebGraphics";
import { playTactileClick } from "./audio";

// State
let state: GameState = createInitialState();
let isRendering = false;
let soundEnabled = true;

// DOM Elements
const canvasEl = document.getElementById("epaper-canvas") as HTMLCanvasElement;
const ledEl = document.getElementById("status-led") as HTMLElement;
const btnBoot = document.getElementById("btn-boot") as HTMLButtonElement;
const btnPwr = document.getElementById("btn-pwr") as HTMLButtonElement;
const btnBootLabel = document.getElementById("btn-boot-label") as HTMLElement;
const btnPwrLabel = document.getElementById("btn-pwr-label") as HTMLElement;
const btnSound = document.getElementById("btn-sound") as HTMLButtonElement;

const graphics = new WebGraphics(canvasEl);

function getButtonLabels(): { boot: string; pwr: string } {
  switch (state.screen) {
    case "title":
      return { boot: "ENTER", pwr: "ENTER" };
    case "lamp":
      return { boot: "LIGHT", pwr: "LIGHT" };
    case "rest":
      return { boot: "PROCEED", pwr: "PROCEED" };
    case "enemy":
      if (!state.combat) return { boot: "ACTION", pwr: "FLEE" };
      if (state.combat.phase === "encounter") return { boot: "FIGHT", pwr: "FLEE" };
      if (state.combat.phase === "player_turn") return { boot: "STRIKE", pwr: "FLEE" };
      if (state.combat.phase === "player_strike_result" || state.combat.phase === "enemy_turn_result") {
        return { boot: "CONTINUE", pwr: "CONTINUE" };
      }
      if (state.combat.phase === "enemy_defeated" || state.combat.phase === "fled") {
        return { boot: "PROCEED", pwr: "PROCEED" };
      }
      return { boot: "STRIKE", pwr: "FLEE" };
    case "chest":
      const isLeave = state.chest && state.chest.selectedIndex >= state.chest.items.length;
      return { boot: "CYCLE", pwr: isLeave ? "LEAVE" : "TAKE" };
    case "victory":
    case "game_over":
      return { boot: "RESTART", pwr: "RESTART" };
    default:
      return { boot: "ACTION", pwr: "SELECT" };
  }
}

function updateButtonLabels(): void {
  const labels = getButtonLabels();
  if (btnBootLabel) btnBootLabel.textContent = labels.boot;
  if (btnPwrLabel) btnPwrLabel.textContent = labels.pwr;
}

function renderDisplay(fullRefresh: boolean): void {
  if (!graphics) return;

  if (fullRefresh) {
    isRendering = true;
    if (ledEl) ledEl.classList.add("active");
    if (canvasEl) canvasEl.classList.add("epaper-flash");

    // E-paper bi-stable flash transition simulation
    setTimeout(() => {
      graphics.clear();
      const tree = <App state={state} />;
      renderToGraphics(tree, graphics as any);
      if (canvasEl) canvasEl.classList.remove("epaper-flash");
      updateButtonLabels();

      setTimeout(() => {
        isRendering = false;
        if (ledEl) ledEl.classList.remove("active");
      }, 100);
    }, 300);
  } else {
    // Fast partial refresh: instant update + LED pulse
    isRendering = true;
    if (ledEl) ledEl.classList.add("active");
    graphics.clear();
    const tree = <App state={state} />;
    renderToGraphics(tree, graphics as any);
    updateButtonLabels();

    setTimeout(() => {
      isRendering = false;
      if (ledEl) ledEl.classList.remove("active");
    }, 120);
  }
}

function triggerButton(button: "BOOT" | "PWR"): void {
  if (isRendering) return;

  // Haptic feedback for mobile touchscreens
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    try {
      navigator.vibrate(15);
    } catch (e) {}
  }

  // Audio tactile switch feedback
  if (soundEnabled) {
    playTactileClick();
  }

  const result = handleInput(state, button);
  renderDisplay(result.needsFullRefresh);
}

// Attach zero-latency pointer listeners (works for both touch & mouse)
if (btnBoot) {
  btnBoot.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    triggerButton("BOOT");
  });
}

if (btnPwr) {
  btnPwr.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    triggerButton("PWR");
  });
}

// Sound toggle listener
if (btnSound) {
  btnSound.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    btnSound.textContent = soundEnabled ? "SOUND: ON" : "SOUND: OFF";
  });
}

// Keyboard shortcuts for desktop testing
window.addEventListener("keydown", (e: KeyboardEvent) => {
  if (e.key === "b" || e.key === "B" || e.key === "ArrowLeft") {
    e.preventDefault();
    triggerButton("BOOT");
  } else if (e.key === "p" || e.key === "P" || e.key === "ArrowRight" || e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    triggerButton("PWR");
  }
});

// Initial render
updateButtonLabels();
renderDisplay(false);
