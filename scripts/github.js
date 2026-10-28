const { execSync } = require("child_process");

function queryGitHub(options = {}) {
  const owner = options.owner || process.env.GITHUB_OWNER || "ImmersiveLabsUkOrg";
  const repo = options.repo || process.env.GITHUB_REPO || "mittens";
  const username = options.username || process.env.GITHUB_USER || "thisoldbear";
  const limit = options.limit || 5;

  const query = `
    query {
      repository(owner: "${owner}", name: "${repo}") {
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
      user(login: "${username}") {
        pullRequests(first: ${limit}, states: [OPEN, MERGED], orderBy: {field: UPDATED_AT, direction: DESC}) {
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
    console.error("[GitHub] Failed to query via gh CLI:", err.message);
    return null;
  }
}

module.exports = { queryGitHub };
