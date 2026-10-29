import test from "node:test";
import assert from "node:assert/strict";
import { parseGraphQLData } from "../src/parser.ts";
import type { PRItem, GitHubGraphQLData } from "../src/parser.ts";

test("parseGraphQLData - extracts PR details correctly", () => {
  const payload = {
    repository: {
      mergeQueue: {
        entries: { nodes: [] },
      },
    },
    user: {
      pullRequests: {
        nodes: [
          {
            number: 14230,
            title: "fix: editor bug",
            state: "OPEN",
            mergedAt: null,
            comments: { totalCount: 3 },
            reviews: { nodes: [{ state: "APPROVED", author: { login: "reviewer" } }] },
          },
        ],
      },
    },
  };

  const result = parseGraphQLData(payload, "thisoldbear");
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].number, 14230);
  assert.equal(result.items[0].title, "fix: editor bug");
  assert.equal(result.items[0].state, "OPEN");
  assert.equal(result.items[0].commentCount, 3);
  assert.equal(result.items[0].latestReview, "APPROVED");
  assert.equal(result.items[0].queuePosition, null);
  assert.equal(result.items[0].kickedOut, false);
  assert.equal(result.items[0].hasNewComment, false);
  assert.equal(result.alertTriggered, false);
});

test("parseGraphQLData - detects queue entry", () => {
  const payload = {
    repository: {
      mergeQueue: {
        entries: {
          nodes: [
            {
              position: 1,
              state: "QUEUED",
              pullRequest: { number: 14230, author: { login: "thisoldbear" } },
            },
          ],
        },
      },
    },
    user: {
      pullRequests: {
        nodes: [
          {
            number: 14230,
            title: "fix: editor bug",
            state: "OPEN",
            comments: { totalCount: 0 },
            reviews: { nodes: [] },
          },
        ],
      },
    },
  };

  const result = parseGraphQLData(payload, "thisoldbear", [], {});
  assert.equal(result.alertTriggered, true);
  assert.equal(result.items[0].queuePosition, 1);
  assert.equal(result.items[0].queueState, "QUEUED");
  assert.match(result.alerts[0], /ENTERED merge queue/);
});

test("parseGraphQLData - detects kicked out from queue", () => {
  const payload = {
    repository: {
      mergeQueue: {
        entries: { nodes: [] },
      },
    },
    user: {
      pullRequests: {
        nodes: [
          {
            number: 14230,
            title: "fix: editor bug",
            state: "OPEN",
            comments: { totalCount: 0 },
            reviews: { nodes: [] },
          },
        ],
      },
    },
  };

  const prevQueue = { 14230: true };
  const prevItems: PRItem[] = [
    {
      number: 14230,
      title: "fix: editor bug",
      state: "OPEN",
      mergedAt: null,
      commentCount: 0,
      latestReview: null,
      queuePosition: 1,
      queueState: "QUEUED",
      kickedOut: false,
      hasNewComment: false,
    },
  ];

  const result = parseGraphQLData(payload, "thisoldbear", prevItems, prevQueue);
  assert.equal(result.alertTriggered, true);
  assert.equal(result.items[0].kickedOut, true);
  assert.match(result.alerts[0], /KICKED OUT/);
});

test("parseGraphQLData - detects successful merge", () => {
  const payload = {
    repository: {
      mergeQueue: { entries: { nodes: [] } },
    },
    user: {
      pullRequests: {
        nodes: [
          {
            number: 14230,
            title: "fix: editor bug",
            state: "MERGED",
            mergedAt: "2026-10-28T15:00:00Z",
            comments: { totalCount: 0 },
            reviews: { nodes: [] },
          },
        ],
      },
    },
  };

  const prevItems: PRItem[] = [
    {
      number: 14230,
      title: "fix: editor bug",
      state: "OPEN",
      mergedAt: null,
      commentCount: 0,
      latestReview: null,
      queuePosition: 1,
      queueState: "QUEUED",
      kickedOut: false,
      hasNewComment: false,
    },
  ];

  const result = parseGraphQLData(payload, "thisoldbear", prevItems, { 14230: true });
  assert.equal(result.alertTriggered, true);
  assert.equal(result.items[0].state, "MERGED");
  assert.equal(result.items[0].kickedOut, false); // Merged PRs are not kicked out
  assert.match(result.alerts[0], /has MERGED/);
});

test("parseGraphQLData - detects new comments", () => {
  const payload: GitHubGraphQLData = {
    repository: { mergeQueue: { entries: { nodes: [] } } },
    user: {
      pullRequests: {
        nodes: [
          {
            number: 14230,
            title: "fix: editor bug",
            state: "OPEN",
            comments: { totalCount: 5 },
            reviews: { nodes: [] },
          },
        ],
      },
    },
  };

  const prevItems: PRItem[] = [
    {
      number: 14230,
      title: "fix: editor bug",
      state: "OPEN",
      mergedAt: null,
      commentCount: 2,
      latestReview: null,
      queuePosition: null,
      queueState: null,
      kickedOut: false,
      hasNewComment: false,
    },
  ];

  const result = parseGraphQLData(payload, "thisoldbear", prevItems, {});
  assert.equal(result.alertTriggered, true);
  assert.equal(result.items[0].hasNewComment, true);
  assert.equal(result.items[0].commentCount, 5);
  assert.match(result.alerts[0], /NEW COMMENT/);
});
