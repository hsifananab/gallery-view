import type { MarkdownPostProcessorContext } from "obsidian";
import { Plugin } from "obsidian";
import { GalleryCodeBlock } from "./gallery/codeblock";
import { parseGalleryConfig } from "./gallery/config";
import { GalleryDataSource } from "./gallery/data";
import { GalleryRenderer } from "./gallery/renderer";

export default class GalleryViewPlugin extends Plugin {
  async onload(): Promise<void> {
    this.registerMarkdownCodeBlockProcessor(
      "gallery",
      (source, el, ctx) => this.renderGallery(source, el, ctx),
    );
  }

  private renderGallery(
    source: string,
    container: HTMLElement,
    ctx: MarkdownPostProcessorContext,
  ): void {
    let config;
    try {
      config = parseGalleryConfig(source);
    } catch (err) {
      container.createEl("pre", {
        text: `⚠️ gallery: ${err instanceof Error ? err.message : "Invalid YAML"}`,
      });
      return;
    }

    const dataSource = new GalleryDataSource(this.app, config);
    const renderer = new GalleryRenderer(this.app, container, dataSource);
    const block = new GalleryCodeBlock(this.app, container, renderer);
    ctx.addChild(block);
  }
}
