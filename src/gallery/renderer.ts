import type { App } from "obsidian";
import { TFile } from "obsidian";
import { GalleryDataSource } from "./data";
import type { GalleryConfig, GalleryItem } from "./types";
import { GALLERY_CSS } from "./ui/styles";
import {
  createChip,
  clearCloud,
  updateChipStates,
} from "./ui/chips";
import {
  captureRects,
  buildExitingList,
  animateExits,
  animateEntrance,
  animateReflow,
} from "./ui/animations";

export class GalleryRenderer {
  private readonly config: GalleryConfig;
  private filterDiv: HTMLDivElement;
  private cloud: HTMLDivElement;
  private tagContainer: HTMLDivElement;
  private statusField?: string;
  private grid: HTMLDivElement;
  private resizeObserver?: ResizeObserver;
  private styleEl?: HTMLStyleElement;
  private tagAllChip: HTMLButtonElement;
  private tagChips = new Map<string, HTMLButtonElement>();
  private items: GalleryItem[] = [];
  private activeTag = "";
  private statusMode: "all" | "true" | "false" = "all";
  private statusControl?: HTMLDivElement;
  private statusButtons = new Map<"all" | "true" | "false", HTMLButtonElement>();
  private refreshPromise: Promise<void> | null = null;

  constructor(
    private readonly app: App,
    private readonly container: HTMLElement,
    private readonly dataSource: GalleryDataSource,
  ) {
    this.config = dataSource.config;
    this.statusField = this.config.statusField;
    this.filterDiv = container.createDiv({ cls: "gallery-filter" });

    this.cloud = this.filterDiv.createDiv({ cls: "tag-cloud" });

    this.tagContainer = this.cloud.createDiv({ cls: "tag-cloud__tags" });

    this.grid = container.createDiv({ cls: "film-grid" });

    this.tagAllChip = createChip({
      label: "all",
      type: "tag",
      key: "",
      active: true,
    });
    this.tagContainer.appendChild(this.tagAllChip);
  }

  mount(): void {
    this.styleEl = document.createElement("style");
    this.styleEl.textContent = GALLERY_CSS;
    document.head.appendChild(this.styleEl);

    this.cloud.addEventListener("pointerenter", () =>
      this.cloud.classList.add("is-hovering"),
    );
    this.cloud.addEventListener("pointerleave", () =>
      this.cloud.classList.remove("is-hovering"),
    );
    this.cloud.addEventListener("click", (event) => {
      const target = event.target as HTMLElement;
      const segment = target.closest<HTMLButtonElement>(".status-segment");
      if (segment) {
        const value = segment.dataset.value as "all" | "true" | "false" | undefined;
        if (value) this.setStatusMode(value);
        return;
      }

      const btn = target.closest<HTMLButtonElement>(".tag-chip");
      if (!btn) return;
      const { key } = btn.dataset;
      this.activeTag = key ?? "";
      void this.render().then(() =>
        requestAnimationFrame(() => this.updateFilterUI()),
      );
    });

    this.grid.addEventListener("click", (event) => {
      const anchor = (event.target as HTMLElement).closest<HTMLAnchorElement>(
        "a",
      );
      if (!anchor) return;
      event.preventDefault();
      const { path } = anchor.dataset;
      if (!path) return;
      const newLeaf = (event.metaKey ?? false) || (event.ctrlKey ?? false);
      this.openFile(path, newLeaf);
    });

    void this.refresh();

    this.resizeObserver = new ResizeObserver(() => {
      if (!this.refreshPromise) {
        void this.render().then(() =>
          requestAnimationFrame(() => this.updateFilterUI()),
        );
      }
    });
    this.resizeObserver.observe(this.grid);
  }

  unmount(): void {
    this.cloud.classList.remove("is-hovering");
    this.cloud.replaceChildren();
    this.grid.replaceChildren();
    this.tagChips.clear();
    if (this.styleEl?.parentElement) {
      this.styleEl.parentElement.removeChild(this.styleEl);
    }
    this.resizeObserver?.disconnect();
  }

  handlesFile(file: TFile | null): boolean {
    return this.dataSource.handlesFile(file ?? null);
  }

  refresh(): Promise<void> {
    if (this.refreshPromise) return this.refreshPromise;
    this.refreshPromise = (async () => {
      try {
        const items = await this.dataSource.collectItems();
        this.items = items;
        this.rebuildFilters();
        await this.render();
        requestAnimationFrame(() => this.updateFilterUI());
      } catch (error) {
        console.error("gallery-view: failed to refresh gallery", error);
      } finally {
        this.refreshPromise = null;
      }
    })();
    return this.refreshPromise;
  }

  private async render(): Promise<void> {
    const previousRects = captureRects(this.grid);

    let list = this.items;
    if (this.activeTag) {
      list = list.filter((item) => item.tags.includes(this.activeTag ?? ""));
    }
    list = list.filter((item) => this.matchesStatusFilter(item));


    const existingMap = new Map<string, HTMLAnchorElement>();
    Array.from(this.grid.children).forEach((child) => {
      const anchor = child as HTMLAnchorElement;
      if (anchor.dataset.path) {
        existingMap.set(anchor.dataset.path, anchor);
        this.ensureTiltStructure(anchor);
      }
    });

    const incomingPaths = new Set(list.map((item) => item.file.path));
    const exiting = buildExitingList(existingMap, incomingPaths);
    if (exiting.length) {
      await animateExits(exiting);
      for (const { path } of exiting) existingMap.delete(path);
    }

    const gap = 6;
    const containerWidth = this.grid.clientWidth || this.grid.getBoundingClientRect().width;
    const idealCardWidth = Math.max(80, this.config.cardWidth ?? 120);
    const cols = Math.max(1, Math.floor((containerWidth + gap) / (idealCardWidth + gap)));
    const rawWidth = (containerWidth - gap * (cols - 1)) / cols;
    const cardWidth = Math.max(96, Math.floor(rawWidth));
    const cardHeight = Math.round(cardWidth * 1.5);
    const radius = Math.round(cardWidth * 0.05);
    this.grid.style.setProperty("--card-width", `${cardWidth}px`);
    this.grid.style.setProperty("--card-height", `${cardHeight}px`);
    this.grid.style.setProperty("--card-radius", `${radius}px`);
    this.grid.style.setProperty("--card-columns", `${cols}`);

    list.forEach((item, index) => {
      if (existingMap.has(item.file.path)) return;
      const anchor = document.createElement("a");
      anchor.href = item.file.path;
      anchor.dataset.path = item.file.path;
      const wrapper = document.createElement("div");
      wrapper.className = "card-tilt";
      const img = document.createElement("img");
      img.src = item.cover;
      img.loading = "lazy";
      wrapper.appendChild(img);
      anchor.appendChild(wrapper);
      anchor.style.opacity = "0";
      this.grid.appendChild(anchor);
      this.applyCardTilt(anchor);
      animateEntrance(anchor, index, cols);
    });

    this.grid
      .querySelectorAll<HTMLAnchorElement>("a[data-path]")
      .forEach((anchor) => this.applyCardTilt(anchor));

    animateReflow(this.grid, previousRects);
  }

  private rebuildFilters(): void {
    clearCloud(this.tagContainer, this.tagAllChip);
    this.tagChips.clear();

    const tagSet = new Set<string>();
    for (const item of this.items) {
      for (const tag of item.tags) {
        if (tag !== this.config.mainTag) {
          tagSet.add(tag);
        }
      }
    }

    const chips: HTMLButtonElement[] = [];
    for (const tag of [...tagSet].sort((a, b) => a.localeCompare(b))) {
      const chip = createChip({ label: tag, type: "tag", key: tag, active: false });
      chips.push(chip);
      this.tagChips.set(tag, chip);
    }
    for (const chip of chips) this.tagContainer.appendChild(chip);

    this.renderStatusToggles();
    this.updateStatusToggles();
  }

  private updateFilterUI(): void {
    updateChipStates(
      this.tagAllChip,
      this.tagChips,
      this.activeTag,
    );
    this.updateStatusToggles();
  }
  private renderStatusToggles(): void {
    if (!this.statusField) return;
    if (this.statusControl) {
      this.statusControl.remove();
      this.statusButtons.clear();
    }
    const control = document.createElement("div");
    control.className = "status-control";
    control.setAttribute("role", "radiogroup");
    control.setAttribute("aria-label", "Status filter");

    const segments: Array<{ value: "all" | "true" | "false"; symbol: string; aria: string }> = [
      { value: "all", symbol: "◎", aria: "Show all statuses" },
      { value: "true", symbol: "✓", aria: "Only truthy statuses" },
      { value: "false", symbol: "✕", aria: "Only falsy statuses" },
    ];

    segments.forEach(({ value, symbol, aria }) => {
      const button = document.createElement("button");
      button.className = "status-segment";
      button.type = "button";
      button.dataset.value = value;
      button.textContent = symbol;
      button.setAttribute("role", "radio");
      button.setAttribute("aria-label", aria);
      button.title = aria;
      button.tabIndex = value === this.statusMode ? 0 : -1;
      control.appendChild(button);
      this.statusButtons.set(value, button);
    });

    control.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const order: Array<"all" | "true" | "false"> = ["all", "true", "false"];
      const current = order.indexOf(this.statusMode);
      let nextIndex = current;
      if (event.key === "ArrowLeft") {
        nextIndex = (current + order.length - 1) % order.length;
      } else if (event.key === "ArrowRight") {
        nextIndex = (current + 1) % order.length;
      } else if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = order.length - 1;
      }
      this.setStatusMode(order[nextIndex]);
      this.statusButtons.get(order[nextIndex])?.focus();
    });

    this.tagContainer.appendChild(control);
    this.statusControl = control;
  }

  private updateStatusToggles(): void {
    if (!this.statusField || !this.statusControl) return;
    const segments: Array<"all" | "true" | "false"> = ["all", "true", "false"];
    segments.forEach((value) => {
      const button = this.statusButtons.get(value);
      if (!button) return;
      const active = value === this.statusMode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-checked", String(active));
      button.tabIndex = active ? 0 : -1;
    });
  }

  private matchesStatusFilter(item: GalleryItem): boolean {
    if (!this.statusField) return true;
    if (this.statusMode === "all") return true;
    const value = item.frontmatter[this.statusField];
    const isTrue = this.toBoolean(value);
    return this.statusMode === (isTrue ? "true" : "false");
  }

  private setStatusMode(mode: "all" | "true" | "false"): void {
    if (!this.statusField) return;
    if (this.statusMode === mode) return;
    this.statusMode = mode;
    void this.render().then(() =>
      requestAnimationFrame(() => this.updateFilterUI()),
    );
  }

  private ensureTiltStructure(anchor: HTMLAnchorElement): HTMLElement | null {
    let wrapper = anchor.querySelector<HTMLElement>(".card-tilt");
    if (wrapper) return wrapper;
    const img = anchor.querySelector("img");
    if (!img) return null;
    wrapper = document.createElement("div");
    wrapper.className = "card-tilt";
    img.replaceWith(wrapper);
    wrapper.appendChild(img);
    return wrapper;
  }

  private applyCardTilt(anchor: HTMLAnchorElement): void {
    if (anchor.dataset.tiltBound === "true") return;
    const wrapper = this.ensureTiltStructure(anchor);
    if (!wrapper) return;

    const maxTilt = 9;
    const update = (rx: number, ry: number) => {
      wrapper.style.setProperty("--rx", `${rx}deg`);
      wrapper.style.setProperty("--ry", `${ry}deg`);
    };

    const handleMove = (event: PointerEvent) => {
      const rect = anchor.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const rotateY = (x - 0.5) * maxTilt * 2;
      const rotateX = (0.5 - y) * maxTilt * 2;
      update(rotateX, rotateY);
    };

    const reset = () => update(0, 0);

    anchor.addEventListener("pointermove", handleMove);
    anchor.addEventListener("pointerleave", reset);
    anchor.addEventListener("pointerup", reset);
    anchor.addEventListener("pointercancel", reset);

    anchor.dataset.tiltBound = "true";
  }

  private toBoolean(value: unknown): boolean {
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (normalized === "true" || normalized === "yes" || normalized === "1") {
        return true;
      }
      if (
        normalized === "false" ||
        normalized === "no" ||
        normalized === "0" ||
        normalized === ""
      ) {
        return false;
      }
    }
    return Boolean(value);
  }

  private openFile(path: string, inNewLeaf: boolean): void {
    const { workspace, vault } = this.app;
    const file = vault.getAbstractFileByPath(path);
    if (!(file instanceof TFile)) return;
    const leaf = inNewLeaf
      ? workspace.getLeaf(true)
      : workspace.getMostRecentLeaf() ?? workspace.getLeaf();
    leaf.openFile(file, { active: true });
  }
}
