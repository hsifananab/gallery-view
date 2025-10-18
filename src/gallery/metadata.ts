import type { CachedMetadata, TFile } from "obsidian";

export async function extractInlineFields(
  file: TFile,
  cache: CachedMetadata,
  read: (file: TFile) => Promise<string>,
): Promise<Record<string, unknown>> {
  const result: Record<string, unknown> = {};
  let text = "";
  try {
    text = await read(file);
  } catch (error) {
    console.error(
      `gallery-view: failed to read ${file.path} for inline fields`,
      error,
    );
    return result;
  }
  const lines = text.split(/\r?\n/);
  const frontmatterEnd = cache.frontmatter?.position?.end?.line ?? -1;
  for (let index = 0; index < lines.length; index++) {
    if (index <= frontmatterEnd) continue;
    const line = lines[index];
    const match = line.match(/^\s*([A-Za-z0-9_-]+)::\s*(.+)$/);
    if (!match) continue;
    const [, key, raw] = match;
    if (key.length === 0) continue;
    result[key] = parseInlineValue(raw.trim());
  }
  return result;
}

export function parseInlineValue(raw: string): unknown {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/^true$/i.test(trimmed)) return true;
  if (/^false$/i.test(trimmed)) return false;
  if (!Number.isNaN(Number(trimmed)) && trimmed === `${Number(trimmed)}`) {
    return Number(trimmed);
  }
  if (/^!?\[\[.+\]\]$/.test(trimmed)) {
    return stripLinkSyntax(trimmed);
  }
  if (/^"(.*)"$/.test(trimmed)) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

export function buildTagSet(
  metadata: Record<string, unknown>,
  cache: CachedMetadata,
): Set<string> {
  const tags = new Set<string>();
  const metaTags = metadata["tags"];
  if (typeof metaTags === "string") {
    metaTags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .forEach((tag) => tags.add(tag.replace(/^#/, "")));
  } else if (Array.isArray(metaTags)) {
    for (const tag of metaTags) {
      if (typeof tag === "string") {
        tags.add(tag.trim().replace(/^#/, ""));
      }
    }
  }

  if (cache.tags) {
    cache.tags.forEach((tag) => {
      if (typeof tag.tag === "string") {
        tags.add(tag.tag.replace(/^#/, ""));
      }
    });
  }

  return tags;
}

export function stripLinkSyntax(raw: string): string {
  let text = raw.trim();
  text = text.replace(/^!?\[\[/, "").replace(/\]\]$/, "");
  const pipeIndex = text.indexOf("|");
  if (pipeIndex >= 0) {
    text = text.slice(0, pipeIndex);
  }
  return text;
}
