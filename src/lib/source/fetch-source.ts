import {
  fetchRepoContext,
  parseGitHubUrl,
  type RepoContext,
} from "@/lib/github/fetch-repo";

const MAX_CONTEXT_CHARS = 12_000;

export type SourceKind = "github" | "website";

export interface ProjectContext {
  kind: SourceKind;
  url: string;
  name: string;
  description: string | null;
  rawContext: string;
  truncated: boolean;
  /** Present when kind === "github" */
  github?: Pick<RepoContext, "owner" | "repo" | "defaultBranch">;
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

export function normalizeSourceUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Paste a GitHub repo or website link");
  }
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed.replace(/^\/+/, "")}`;
}

export function isGitHubUrl(url: string): boolean {
  try {
    const host = new URL(normalizeSourceUrl(url)).hostname.replace(/^www\./, "");
    return host === "github.com";
  } catch {
    return false;
  }
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function stripTags(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function extractMeta(html: string, key: string): string | null {
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:name|property)=["']${key}["'][^>]+content=["']([^"']+)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${key}["']`,
      "i",
    ),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtmlEntities(match[1].trim());
  }
  return null;
}

function extractTitle(html: string): string | null {
  const og = extractMeta(html, "og:title");
  if (og) return og;
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match?.[1] ? decodeHtmlEntities(match[1].trim()) : null;
}

function extractHeadings(html: string): string[] {
  const matches = [...html.matchAll(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/gi)];
  return matches
    .map((m) => stripTags(m[1] ?? ""))
    .filter(Boolean)
    .slice(0, 8);
}

function extractParagraphs(html: string): string[] {
  const matches = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)];
  return matches
    .map((m) => stripTags(m[1] ?? ""))
    .filter((text) => text.length > 40)
    .slice(0, 10);
}

async function fetchWebsiteContext(url: string): Promise<ProjectContext> {
  const normalized = normalizeSourceUrl(url);
  const response = await fetch(normalized, {
    headers: {
      "User-Agent":
        "RepromoBot/1.0 (+https://repromo.vercel.app; product-video-generator)",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(
      `Could not open that website (${response.status}). Check the link and try again.`,
    );
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
    throw new Error("That link does not look like a website page we can read.");
  }

  const html = await response.text();
  const title = extractTitle(html);
  const description =
    extractMeta(html, "description") ??
    extractMeta(html, "og:description") ??
    null;
  const siteName = extractMeta(html, "og:site_name");
  const headings = extractHeadings(html);
  const paragraphs = extractParagraphs(html);
  const hostname = new URL(normalized).hostname.replace(/^www\./, "");
  const name = title || siteName || hostname;

  const raw = [
    `# Website: ${name}`,
    `URL: ${normalized}`,
    description ? `Description: ${description}` : "",
    siteName ? `Site name: ${siteName}` : "",
    headings.length ? `## Headlines\n${headings.map((h) => `- ${h}`).join("\n")}` : "",
    paragraphs.length ? `## Page copy\n${paragraphs.join("\n\n")}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  if (raw.length < 80) {
    throw new Error(
      "Could not read enough from that page. Try the homepage or a public product URL.",
    );
  }

  const { text, truncated } = truncateText(raw, MAX_CONTEXT_CHARS);

  return {
    kind: "website",
    url: normalized,
    name,
    description,
    rawContext: text,
    truncated,
  };
}

async function fetchGitHubAsProject(url: string): Promise<ProjectContext> {
  const repo = await fetchRepoContext(url);
  return {
    kind: "github",
    url: repo.url,
    name: `${repo.owner}/${repo.repo}`,
    description: repo.description,
    rawContext: repo.rawContext,
    truncated: repo.truncated,
    github: {
      owner: repo.owner,
      repo: repo.repo,
      defaultBranch: repo.defaultBranch,
    },
  };
}

export async function fetchProjectContext(input: string): Promise<ProjectContext> {
  const normalized = normalizeSourceUrl(input);

  if (isGitHubUrl(normalized)) {
    // Validate shape early for clearer errors
    parseGitHubUrl(normalized);
    return fetchGitHubAsProject(normalized);
  }

  return fetchWebsiteContext(normalized);
}
