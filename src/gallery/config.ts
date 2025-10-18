import { parseYaml } from "obsidian";
import type { GalleryConfig } from "./types";

export function parseGalleryConfig(source: string): GalleryConfig {
  const raw = parseYaml(source) as Partial<GalleryConfig> | null;
  if (!raw) {
    throw new Error("Missing configuration");
  }
  if (!raw.mainTag || !raw.typePath) {
    throw new Error("`mainTag` and `typePath` are required.");
  }

  return {
    mainTag: raw.mainTag,
    typePath: raw.typePath,
    excludeFolder: raw.excludeFolder,
    coverField: raw.coverField ?? "cover",
    statusField: raw.statusField,
    cardWidth: typeof raw.cardWidth === "number" ? raw.cardWidth : undefined,
  };
}
