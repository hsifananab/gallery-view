import type { App } from "obsidian";
import { TFile } from "obsidian";
import type { GalleryConfig, GalleryItem } from "./types";
import { extractInlineFields, buildTagSet } from "./metadata";
import {
  normalizeTypePath,
  getTypeBaseName,
  resolveCoverSource,
  shouldExcludeFile,
} from "./paths";

export class GalleryDataSource {
  constructor(
    private readonly app: App,
    public readonly config: GalleryConfig,
  ) {}

  handlesFile(file: TFile | null): boolean {
    if (!file) return false;
    return file.extension === "md";
  }

  async collectItems(): Promise<GalleryItem[]> {
    const files = this.app.vault.getMarkdownFiles();
    const results: GalleryItem[] = [];
    const normalizedType = normalizeTypePath(this.app, this.config.typePath);
    const normalizedTypeName = getTypeBaseName(normalizedType);

    for (const file of files) {
      if (shouldExcludeFile(this.config.excludeFolder, file)) continue;

      const cache = this.app.metadataCache.getFileCache(file);
      if (!cache) continue;

      const inlineFields = await extractInlineFields(
        file,
        cache,
        (f) => this.app.vault.cachedRead(f),
      );
      const frontmatter = (cache.frontmatter ??
        {}) as Record<string, unknown>;
      const metadata = { ...inlineFields, ...frontmatter };

      const typePath = this.extractTypePath(metadata["type"], file);
      if (!typePath) continue;
      const typeName = getTypeBaseName(typePath);
      const matchesType =
        typePath === normalizedType || typeName === normalizedTypeName;
      if (!matchesType) continue;

      const coverField = this.config.coverField ?? "cover";
      const cover = await resolveCoverSource(this.app, metadata[coverField], file);
      if (!cover) continue;

      const tags = buildTagSet(metadata, cache);
      const normalizedTags = [...tags].sort((a, b) => a.localeCompare(b));

      results.push({
        file,
        cover,
        tags: normalizedTags,
        frontmatter: metadata,
        created: file.stat.ctime,
      });
    }

    results.sort((a, b) => b.created - a.created);
    return results;
  }

  private extractTypePath(typeField: unknown, file: TFile): string | null {
    if (!typeField) return null;
    if (Array.isArray(typeField)) {
      for (const entry of typeField) {
        const resolved = this.extractTypePath(entry, file);
        if (resolved) return resolved;
      }
      return null;
    }
    if (typeof typeField === "string") {
      const normalized = normalizeTypePath(this.app, typeField, file);
      return normalized || null;
    }
    if (typeof typeField === "object" && typeField !== null) {
      const record = typeField as Record<string, unknown>;
      if (typeof record.path === "string") {
        const normalized = normalizeTypePath(this.app, record.path, file);
        if (normalized) return normalized;
      }
      if (typeof record.link === "string") {
        const normalized = normalizeTypePath(this.app, record.link, file);
        if (normalized) return normalized;
      }
      if (typeof record.file === "string") {
        const normalized = normalizeTypePath(this.app, record.file, file);
        if (normalized) return normalized;
      }
    }
    return null;
  }
}
