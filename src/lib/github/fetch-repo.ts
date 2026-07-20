const GITHUB_API = "https://api.github.com";
const MAX_CONTEXT_CHARS = 12_000;

export interface ParsedGitHubUrl {
  owner: string;
  repo: string;
  branch?: string;
}

export interface RepoContext {
  owner: string;
  repo: string;
  url: string;
  description: string | null;
  defaultBranch: string;
  readme: string | null;
  packageJson: Record<string, unknown> | null;
  treeSummary: string[];
  truncated: boolean;
  rawContext: string;
}

function githubHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export function parseGitHubUrl(input: string): ParsedGitHubUrl {
  const trimmed = input.trim();

  let pathname = trimmed;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    pathname = new URL(trimmed).pathname;
  } else if (trimmed.startsWith("github.com/")) {
    pathname = `/${trimmed.slice("github.com/".length)}`;
  } else if (!trimmed.includes("/")) {
    throw new Error("Invalid GitHub URL: expected owner/repo format");
  } else if (!trimmed.startsWith("/")) {
    pathname = `/${trimmed}`;
  }

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length < 2) {
    throw new Error("Invalid GitHub URL: expected owner/repo format");
  }

  const [owner, repoWithSuffix, ...rest] = segments;
  const repo = repoWithSuffix.replace(/\.git$/, "");

  let branch: string | undefined;
  if (rest[0] === "tree" || rest[0] === "blob") {
    branch = rest[1];
  }

  return { owner, repo, branch };
}

async function fetchJson<T>(url: string): Promise<T | null> {
  const response = await fetch(url, { headers: githubHeaders() });
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API error (${response.status}): ${body}`);
  }
  return (await response.json()) as T;
}

async function fetchReadme(owner: string, repo: string): Promise<string | null> {
  const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/readme`, {
    headers: {
      ...githubHeaders(),
      Accept: "application/vnd.github.raw+json",
    },
  });

  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to fetch README (${response.status}): ${body}`);
  }

  return response.text();
}

async function fetchPackageJson(
  owner: string,
  repo: string,
): Promise<Record<string, unknown> | null> {
  const data = await fetchJson<{ content?: string; encoding?: string }>(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/package.json`,
  );
  if (!data?.content) {
    return null;
  }

  const decoded =
    data.encoding === "base64"
      ? Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf8")
      : data.content;

  return JSON.parse(decoded) as Record<string, unknown>;
}

async function fetchTreeSummary(
  owner: string,
  repo: string,
  branch: string,
): Promise<string[]> {
  const tree = await fetchJson<{
    tree?: Array<{ path: string; type: string }>;
    truncated?: boolean;
  }>(`${GITHUB_API}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`);

  if (!tree?.tree) {
    return [];
  }

  const paths = tree.tree
    .filter((entry) => entry.type === "blob")
    .map((entry) => entry.path)
    .filter((path) => {
      const lower = path.toLowerCase();
      return (
        !lower.includes("node_modules/") &&
        !lower.includes(".git/") &&
        !lower.endsWith(".lock") &&
        !lower.match(/\.(png|jpg|jpeg|gif|svg|ico|woff2?|ttf|mp4|zip)$/)
      );
    })
    .slice(0, 200);

  if (tree.truncated) {
    paths.push("...(tree truncated by GitHub API)");
  }

  return paths;
}

function truncateText(text: string, maxChars: number): { text: string; truncated: boolean } {
  if (text.length <= maxChars) {
    return { text, truncated: false };
  }
  return {
    text: `${text.slice(0, maxChars)}\n\n...(truncated for token budget)`,
    truncated: true,
  };
}

function buildRawContext(parts: {
  owner: string;
  repo: string;
  description: string | null;
  readme: string | null;
  packageJson: Record<string, unknown> | null;
  treeSummary: string[];
}): string {
  const sections: string[] = [
    `# Repository: ${parts.owner}/${parts.repo}`,
    parts.description ? `Description: ${parts.description}` : "",
    parts.readme ? `## README\n${parts.readme}` : "",
    parts.packageJson
      ? `## package.json\n${JSON.stringify(parts.packageJson, null, 2)}`
      : "",
    parts.treeSummary.length > 0
      ? `## File tree (sample)\n${parts.treeSummary.join("\n")}`
      : "",
  ];

  return sections.filter(Boolean).join("\n\n");
}

export async function fetchRepoContext(repoUrl: string): Promise<RepoContext> {
  const parsed = parseGitHubUrl(repoUrl);
  const repoMeta = await fetchJson<{
    description: string | null;
    default_branch: string;
    html_url: string;
  }>(`${GITHUB_API}/repos/${parsed.owner}/${parsed.repo}`);

  if (!repoMeta) {
    throw new Error(`Repository not found: ${parsed.owner}/${parsed.repo}`);
  }

  const branch = parsed.branch ?? repoMeta.default_branch;

  const [readme, packageJson, treeSummary] = await Promise.all([
    fetchReadme(parsed.owner, parsed.repo),
    fetchPackageJson(parsed.owner, parsed.repo),
    fetchTreeSummary(parsed.owner, parsed.repo, branch),
  ]);

  const rawContext = buildRawContext({
    owner: parsed.owner,
    repo: parsed.repo,
    description: repoMeta.description,
    readme,
    packageJson,
    treeSummary,
  });

  const { text: boundedContext, truncated } = truncateText(
    rawContext,
    MAX_CONTEXT_CHARS,
  );

  return {
    owner: parsed.owner,
    repo: parsed.repo,
    url: repoMeta.html_url,
    description: repoMeta.description,
    defaultBranch: branch,
    readme,
    packageJson,
    treeSummary,
    truncated,
    rawContext: boundedContext,
  };
}
