export interface AppConfig {
  wifi: {
    ssid: string;
    password: string;
  };
  github: {
    token: string;
    owner: string;
    repo: string;
    username: string;
    pollIntervalMs: number;
  };
}

export const config: AppConfig = {
  wifi: {
    ssid: "iPhone", // Your phone hotspot SSID
    password: "your_hotspot_password",
  },
  github: {
    token: "", // GitHub Personal Access Token (classic with 'repo' scope or fine-grained with pull_request read)
    owner: "ImmersiveLabsUkOrg",
    repo: "mittens",
    username: "thisoldbear",
    pollIntervalMs: 45000, // Poll every 45 seconds
  },
};
