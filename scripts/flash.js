const fs = require("fs");
const espruino = require("espruino");

const PORT = process.env.ESPRUINO_PORT || "52dc30f4a4c7e590ad4e7cebe78b1320";
const APP_PATH = "dist/app.js";

async function main() {
  if (!fs.existsSync(APP_PATH)) {
    console.error(`Error: ${APP_PATH} not found!`);
    process.exit(1);
  }

  const appData = fs.readFileSync(APP_PATH);
  console.log(`[Flash] Loaded ${APP_PATH} (${appData.length} bytes).`);

  await new Promise((resolve) => espruino.init(resolve));

  console.log(`[Flash] Connecting to Espruino via BLE (${PORT})...`);
  await new Promise((resolve, reject) => {
    Espruino.Core.Serial.open(PORT, (status) => {
      if (!status) {
        reject(new Error("Unable to connect to Espruino via BLE"));
      } else {
        resolve();
      }
    });
  });

  console.log("[Flash] Connected!");

  function exec(cmd) {
    return new Promise((resolve) => {
      Espruino.Core.Utils.executeExpression(cmd, (res) => {
        resolve(res);
      });
    });
  }

  // Erase existing .bootcde
  console.log("[Flash] Preparing Flash Storage (.bootcde)...");
  await exec("require('Storage').erase('.bootcde')");

  // Chunked write via Base64
  const chunkSize = 512;
  const total = appData.length;
  console.log(`[Flash] Writing ${total} bytes in chunks of ${chunkSize}...`);

  for (let offset = 0; offset < total; offset += chunkSize) {
    const end = Math.min(offset + chunkSize, total);
    const chunk = appData.subarray(offset, end);
    const b64 = chunk.toString("base64");

    const expr =
      offset === 0
        ? `require('Storage').write('.bootcde', atob("${b64}"), 0, ${total})`
        : `require('Storage').write('.bootcde', atob("${b64}"), ${offset})`;

    const ok = await exec(expr);
    const pct = Math.floor((end / total) * 100);
    process.stdout.write(`\r[Flash] Progress: ${end}/${total} bytes (${pct}%)`);
  }
  console.log("\n[Flash] Chunks written.");

  // Verify
  const verifyLen = await exec("require('Storage').read('.bootcde').length");
  console.log(`[Flash] Verification: Stored file size = ${verifyLen} bytes (expected ${total}).`);

  if (Number(verifyLen) !== total) {
    console.error("[Flash] ERROR: Size mismatch!");
  } else {
    console.log("[Flash] Success! Reloading board with new .bootcde...");
    // Load and run
    await exec("eval(require('Storage').read('.bootcde'))");
  }

  setTimeout(() => {
    Espruino.Core.Serial.close();
    console.log("[Flash] Done.");
    process.exit(0);
  }, 1000);
}

main().catch((err) => {
  console.error("[Flash] Fatal error:", err);
  process.exit(1);
});
