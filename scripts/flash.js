const fs = require("fs");
const espruino = require("espruino");
const { execSync } = require("child_process");

const PORT = process.env.ESPRUINO_PORT || "52dc30f4a4c7e590ad4e7cebe78b1320";
const APP_PATH = "dist/app.js";

function queryGitHub() {
  const query = `
    query {
      repository(owner: "ImmersiveLabsUkOrg", name: "mittens") {
        mergeQueue(branch: "main") {
          entries(first: 5) {
            nodes {
              position
              state
              pullRequest {
                number
                author {
                  login
                }
              }
            }
          }
        }
      }
      user(login: "thisoldbear") {
        pullRequests(first: 5, states: [OPEN, MERGED], orderBy: {field: UPDATED_AT, direction: DESC}) {
          nodes {
            number
            title
            state
            mergedAt
            comments {
              totalCount
            }
            reviews(last: 1) {
              nodes {
                state
                author {
                  login
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const output = execSync(`gh api graphql -f query='${query.replace(/\n\s*/g, " ")}'`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return JSON.parse(output).data;
  } catch (err) {
    console.warn("[Flash] Warning: Could not fetch initial GitHub data via gh CLI:", err.message);
    return null;
  }
}

async function main() {
  if (!fs.existsSync(APP_PATH)) {
    console.error(`Error: ${APP_PATH} not found!`);
    process.exit(1);
  }

  const appData = fs.readFileSync(APP_PATH);
  console.log(`[Flash] Loaded ${APP_PATH} (${appData.length} bytes).`);

  await new Promise((resolve) => espruino.init(resolve));

  console.log(`[Flash] Connecting to Espruino (${PORT})...`);
  await new Promise((resolve, reject) => {
    Espruino.Core.Serial.open(PORT, (status) => {
      if (!status) {
        reject(new Error("Unable to connect to Espruino"));
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

  function sendRaw(str) {
    return new Promise((resolve) => {
      Espruino.Core.Serial.write(str, false, () => {
        setTimeout(resolve, 200);
      });
    });
  }

  // 1. Force interrupt any running code
  console.log("[Flash] Stopping running code and freeing memory...");
  await exec("eval('try{clearInterval();clearWatch();epd=null;g=null;prList=null;}catch(e){}true')");

  const mem = await exec("process.memory().free");
  console.log(`[Flash] Free JS heap blocks: ${mem}`);

  // 2. Erase existing .bootcde
  console.log("[Flash] Erasing Flash Storage (.bootcde)...");
  await exec("require('Storage').erase('.bootcde')");

  // 3. Chunked write via Base64 with small chunks (256 bytes) to prevent memory exhaustion
  const chunkSize = 256;
  const total = appData.length;
  console.log(`[Flash] Writing ${total} bytes in ${Math.ceil(total / chunkSize)} chunks of ${chunkSize}b...`);

  for (let offset = 0; offset < total; offset += chunkSize) {
    const end = Math.min(offset + chunkSize, total);
    const chunk = appData.subarray(offset, end);
    const b64 = chunk.toString("base64");

    const expr =
      offset === 0
        ? `require('Storage').write('.bootcde', atob("${b64}"), 0, ${total})`
        : `require('Storage').write('.bootcde', atob("${b64}"), ${offset})`;

    const ok = await exec(expr);
    if (ok !== "true" && ok !== true && typeof ok === "string" && ok.includes("ERROR")) {
      throw new Error(`Write failed at offset ${offset}: ${ok}`);
    }
    const pct = Math.floor((end / total) * 100);
    process.stdout.write(`\r[Flash] Progress: ${end}/${total} bytes (${pct}%)`);
  }
  console.log("\n[Flash] Chunks successfully written.");

  // 4. Strict Verification
  const verifyLen = await exec("require('Storage').read('.bootcde').length");
  console.log(`[Flash] Verification: Stored file size = ${verifyLen} bytes (expected ${total}).`);

  if (Number(verifyLen) !== total) {
    throw new Error(`Size mismatch! Expected ${total} bytes, got ${verifyLen}`);
  }

  console.log("[Flash] Verification passed! Executing fresh .bootcde on device...");
  await exec("eval(require('Storage').read('.bootcde'))");

  // 5. Query GitHub and push fresh data with full hardware refresh wipe
  console.log("[Flash] Fetching live GitHub status to immediately populate display...");
  const githubData = queryGitHub();
  if (githubData) {
    const b64Data = Buffer.from(JSON.stringify(githubData)).toString("base64");
    console.log("[Flash] Injecting live PR data and triggering CLEAN FULL REFRESH...");
    await exec(`globalThis.updatePRData(JSON.parse(atob("${b64Data}")))`);
  } else {
    console.log("[Flash] Forcing clean full refresh...");
    await exec("render(true)");
  }

  // Wait for display busy cycle to complete
  console.log("[Flash] Waiting for e-paper refresh to complete...");
  await new Promise((r) => setTimeout(r, 4000));

  Espruino.Core.Serial.close();
  console.log("\n[Flash] SUCCESS: Device is fully updated and refreshed with clean header!");
  process.exit(0);
}

main().catch((err) => {
  console.error("\n[Flash] Fatal error:", err);
  process.exit(1);
});
