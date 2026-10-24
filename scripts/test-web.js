/**
 * Quick node sanity test for bundle.js mock environment
 */
const fs = require("fs");
const path = require("path");

const bundleCode = fs.readFileSync(path.resolve(__dirname, "../dist-web/bundle.js"), "utf8");

// Mock DOM
const mockCtx = {
  fillStyle: "",
  strokeStyle: "",
  font: "",
  textBaseline: "",
  imageSmoothingEnabled: false,
  fillRect: (x, y, w, h) => {},
  strokeRect: (x, y, w, h) => {},
  beginPath: () => {},
  moveTo: (x, y) => {},
  lineTo: (x, y) => {},
  arc: () => {},
  closePath: () => {},
  fill: () => {},
  stroke: () => {},
  fillText: (text, x, y) => {},
  measureText: (text) => ({ width: text.length * 6 }),
};

const mockCanvas = {
  width: 200,
  height: 200,
  getContext: () => mockCtx,
  classList: { add: () => {}, remove: () => {} },
};

const mockElement = {
  textContent: "",
  classList: { add: () => {}, remove: () => {} },
  addEventListener: () => {},
};

global.document = {
  getElementById: (id) => {
    if (id === "epaper-canvas") return mockCanvas;
    return mockElement;
  },
};

global.window = {
  addEventListener: () => {},
  removeEventListener: () => {},
};

global.navigator = {
  vibrate: () => {},
};

try {
  eval(bundleCode);
  console.log("TEST SUCCESS: bundle.js evaluated without errors!");
} catch (err) {
  console.error("TEST FAILED:", err);
  process.exit(1);
}
