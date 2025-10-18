import {
  MarkdownRenderChild,
  type App,
} from "obsidian";
import { GalleryRenderer } from "./renderer";

export class GalleryCodeBlock extends MarkdownRenderChild {
  constructor(
    private readonly app: App,
    containerEl: HTMLElement,
    private readonly renderer: GalleryRenderer,
  ) {
    super(containerEl);
  }

  onload(): void {
    this.renderer.mount();

    const refresh = () => {
      void this.renderer.refresh();
    };
    this.registerEvent(
      this.app.metadataCache.on("changed", (file) => {
        if (this.renderer.handlesFile(file)) refresh();
      }),
    );
    this.registerEvent(this.app.metadataCache.on("resolved", refresh));
    this.registerEvent(this.app.workspace.on("layout-change", refresh));
  }

  onunload(): void {
    this.renderer.unmount();
  }
}
