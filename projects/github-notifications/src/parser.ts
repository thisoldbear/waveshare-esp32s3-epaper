export interface PRItem {
  number: number;
  title: string;
  state: "OPEN" | "MERGED" | "CLOSED";
  mergedAt: string | null;
  commentCount: number;
  latestReview: string | null;
  queuePosition: number | null;
  queueState: string | null;
  kickedOut: boolean;
  hasNewComment: boolean;
}

export interface MergeQueueAuthor {
  login: string;
}

export interface MergeQueuePullRequest {
  number: number;
  author?: MergeQueueAuthor | null;
}

export interface MergeQueueEntryNode {
  position: number;
  state: string;
  pullRequest?: MergeQueuePullRequest | null;
}

export interface ReviewNode {
  state: string;
  author?: {
    login: string;
  } | null;
}

export interface PullRequestNode {
  number: number;
  title?: string;
  state: "OPEN" | "MERGED" | "CLOSED";
  mergedAt?: string | null;
  comments?: {
    totalCount: number;
  } | null;
  reviews?: {
    nodes?: ReviewNode[];
  } | null;
}

export interface GitHubGraphQLData {
  repository?: {
    mergeQueue?: {
      entries?: {
        nodes?: MergeQueueEntryNode[];
      } | null;
    } | null;
  } | null;
  user?: {
    pullRequests?: {
      nodes?: PullRequestNode[];
    } | null;
  } | null;
}

export interface ParseResult {
  items: PRItem[];
  currentQueuePrs: Record<number, boolean>;
  alertTriggered: boolean;
  alerts: string[];
}

export function parseGraphQLData(
  data: GitHubGraphQLData | null | undefined,
  username: string,
  previousList?: PRItem[],
  previousQueuePrs?: Record<number, boolean>
): ParseResult {
  const prevList = previousList || [];
  const prevQueue = previousQueuePrs || {};

  if (!data) {
    return {
      items: [],
      currentQueuePrs: {},
      alertTriggered: false,
      alerts: [],
    };
  }

  const queueMap: Record<number, { position: number; state: string }> = {};
  const currentQueueSet: Record<number, boolean> = {};

  // Parse Merge Queue entries
  const queueEntries = data.repository?.mergeQueue?.entries?.nodes || [];
  for (let i = 0; i < queueEntries.length; i++) {
    const entry = queueEntries[i];
    const prNum = entry.pullRequest?.number;
    if (prNum) {
      queueMap[prNum] = {
        position: entry.position,
        state: entry.state,
      };
      if (entry.pullRequest?.author?.login === username) {
        currentQueueSet[prNum] = true;
      }
    }
  }

  // Parse User Pull Requests
  const rawPRs = data.user?.pullRequests?.nodes || [];
  const updatedList: PRItem[] = [];
  const alerts: string[] = [];
  let alertTriggered = false;

  for (let i = 0; i < rawPRs.length; i++) {
    const raw = rawPRs[i];
    const num = raw.number;
    const inQueue = queueMap[num];
    const wasInQueue = !!prevQueue[num];

    let prevItem: PRItem | null = null;
    for (let j = 0; j < prevList.length; j++) {
      if (prevList[j].number === num) {
        prevItem = prevList[j];
        break;
      }
    }
    const prevCommentCount = prevItem ? prevItem.commentCount : raw.comments?.totalCount || 0;
    const hasNewComment = (raw.comments?.totalCount || 0) > prevCommentCount;

    // Detect kicked out from queue: was previously in queue, now not, and NOT merged
    const kickedOut = wasInQueue && !inQueue && raw.state !== "MERGED";

    if (kickedOut) {
      alerts.push(`PR #${num} was KICKED OUT of the merge queue!`);
      alertTriggered = true;
    }

    if (inQueue && !wasInQueue) {
      alerts.push(`PR #${num} ENTERED merge queue at pos #${inQueue.position}!`);
      alertTriggered = true;
    }

    if (raw.state === "MERGED" && prevItem && prevItem.state !== "MERGED") {
      alerts.push(`PR #${num} has MERGED!`);
      alertTriggered = true;
    }

    if (hasNewComment) {
      alerts.push(`PR #${num} received a NEW COMMENT!`);
      alertTriggered = true;
    }

    const item: PRItem = {
      number: num,
      title: raw.title || `PR #${num}`,
      state: raw.state,
      mergedAt: raw.mergedAt ?? null,
      commentCount: raw.comments?.totalCount || 0,
      latestReview: raw.reviews?.nodes?.[0]?.state || null,
      queuePosition: inQueue ? inQueue.position : null,
      queueState: inQueue ? inQueue.state : null,
      kickedOut,
      hasNewComment,
    };

    updatedList.push(item);
  }

  return {
    items: updatedList,
    currentQueuePrs: currentQueueSet,
    alertTriggered,
    alerts,
  };
}
