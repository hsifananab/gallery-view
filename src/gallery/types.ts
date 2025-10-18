import type { TFile } from "obsidian";

export interface GalleryConfig {
  mainTag: string;
  typePath: string;
  excludeFolder?: string;
  coverField?: string;
  statusField?: string;
}

export interface GalleryItem {
  file: TFile;
  cover: string;
  tags: string[];
  frontmatter: Record<string, unknown>;
  created: number;
}

export const DEFAULT_PALETTE = {
  base: "#1e1e2e",
  surface0: "#313244",
  surface1: "#45475a",
  surface2: "#585b70",
  text: "#cdd6f4",
  subtext: "#a6adc8",
  accent: "#89b4fa",
  accentText: "#1e1e2e",
} as const;
