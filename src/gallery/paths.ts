import type { App } from "obsidian";
import { TFile } from "obsidian";
import { buildTagSet, stripLinkSyntax } from "./metadata";

export function normalizeTypePath(
  app: App,
  value: string,
  contextFile?: TFile,
): string {
  const cleaned = stripLinkSyntax(value);
  if (!cleaned) return "";
  let resolved = cleaned;
  if (contextFile) {
    const dest = app.metadataCache.getFirstLinkpathDest(
      cleaned,
      contextFile.path,
    );
    if (dest instanceof TFile) {
      resolved = dest.path;
    }
  }
  const normalized = resolved.endsWith(".md") ? resolved : `${resolved}.md`;
  return normalized.replace(/\\/g, "/");
}

export function getTypeBaseName(path: string): string {
  const normalized = path.replace(/\\/g, "/");
  const segments = normalized.split("/");
  const last = segments[segments.length - 1] ?? "";
  return last.replace(/\.md$/i, "");
}

export async function resolveCoverSource(
  app: App,
  value: unknown,
  file: TFile,
): Promise<string | null> {
  if (!value) return null;
  if (Array.isArray(value)) {
    for (const entry of value) {
      const resolved = await resolveCoverSource(app, entry, file);
      if (resolved) return resolved;
    }
    return null;
  }
  if (value instanceof TFile) {
    return app.vault.getResourcePath(value);
  }
  if (typeof value === "object" && value !== null) {
    if ("path" in (value as { path?: unknown })) {
      const pathValue = (value as { path?: unknown }).path;
      if (typeof pathValue === "string") {
        return resolveCoverSource(app, pathValue, file);
      }
    }
    if ("link" in (value as { link?: unknown })) {
      const linkValue = (value as { link?: unknown }).link;
      if (typeof linkValue === "string") {
        return resolveCoverSource(app, linkValue, file);
      }
    }
  }
  if (typeof value === "string") {
    const cleaned = stripLinkSyntax(value);
    if (/^(?:https?:)?\/\//i.test(cleaned)) return cleaned;
    const linked = app.metadataCache.getFirstLinkpathDest(
      cleaned,
      file.path,
    );
    if (linked instanceof TFile) {
      return app.vault.getResourcePath(linked);
    }
    return cleaned;
  }
  return null;
}

export function shouldExcludeFile(
  configExcludeFolder: string | undefined,
  file: TFile,
): boolean {
  if (!configExcludeFolder) return false;
  const normalized = configExcludeFolder.replace(/^\/+|\/+$/g, "");
  const folderPath = file.parent?.path ?? "";
  return folderPath === normalized || folderPath.startsWith(`${normalized}/`);
}

export { buildTagSet };
