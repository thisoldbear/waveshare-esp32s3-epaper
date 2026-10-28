#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// 1. Determine active project
const args = process.argv.slice(2).filter((arg) => !arg.startsWith("-"));
const projectName = args[0] || process.env.PROJECT || "starter";

let entryPoint = "";

if (projectName === "starter" || projectName === "default" || projectName === "core") {
  entryPoint = "src/index.ts";
} else {
  const projectDir = path.join("projects", projectName);
  if (!fs.existsSync(projectDir)) {
    console.error(`Error: Project "${projectName}" not found in projects/ directory!`);
    console.error(`Available projects:`);
    if (fs.existsSync("projects")) {
      const projects = fs.readdirSync("projects").filter((f) => fs.statSync(path.join("projects", f)).isDirectory());
      projects.forEach((p) => console.error(`  - ${p}`));
    }
    console.error(`  - starter (neutral hardware starter)`);
    process.exit(1);
  }

  const candidate1 = path.join(projectDir, "src", "index.ts");
  const candidate2 = path.join(projectDir, "index.ts");
  if (fs.existsSync(candidate1)) {
    entryPoint = candidate1;
  } else if (fs.existsSync(candidate2)) {
    entryPoint = candidate2;
  } else {
    console.error(`Error: No entry point found in ${projectDir} (expected src/index.ts or index.ts)`);
    process.exit(1);
  }
}

console.log(`=== Building Project [${projectName}] ===`);
console.log(`Entry: ${entryPoint}`);

// 2. TypeScript Typecheck
console.log("[Build] Running TypeScript typecheck...");
try {
  execSync("npx tsc --noEmit", { stdio: "inherit" });
} catch (e) {
  console.error("[Build] TypeScript typecheck failed!");
  process.exit(1);
}

// 3. Esbuild Bundle
console.log("[Build] Bundling with esbuild...");
const outDir = "dist";
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const outFile = path.join(outDir, "app.js");
const esbuildCmd = `npx esbuild "${entryPoint}" --bundle --target=es2018 --format=iife --minify --external:http --external:Wifi --external:Storage --outfile="${outFile}"`;

try {
  execSync(esbuildCmd, { stdio: "inherit" });
} catch (e) {
  console.error("[Build] Bundling failed!");
  process.exit(1);
}

// 4. Save metadata for flasher
fs.writeFileSync(
  path.join(outDir, "project.json"),
  JSON.stringify(
    {
      project: projectName,
      entry: entryPoint,
      builtAt: new Date().toISOString(),
    },
    null,
    2
  )
);

console.log(`[Build] Success: Built "${projectName}" -> ${outFile}\n`);
