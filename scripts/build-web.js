const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

const distDir = path.resolve(__dirname, "../dist-web");
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// 1. Bundle JS
esbuild.buildSync({
  entryPoints: [path.resolve(__dirname, "../web/src/main.tsx")],
  bundle: true,
  alias: {
    preact: path.resolve(__dirname, "../src/vdom/index.ts"),
  },
  target: "es2020",
  format: "iife",
  minify: true,
  outfile: path.join(distDir, "bundle.js"),
});

// 2. Copy CSS & HTML
fs.copyFileSync(
  path.resolve(__dirname, "../web/src/styles.css"),
  path.join(distDir, "styles.css")
);
fs.copyFileSync(
  path.resolve(__dirname, "../web/index.html"),
  path.join(distDir, "index.html")
);

console.log("Web emulator built successfully into dist-web/");
