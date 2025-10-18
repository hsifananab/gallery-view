import { DEFAULT_PALETTE } from "../types";

export type ChipKind = "tag" | "status";

export interface ChipSpec {
  label: string;
  type: ChipKind;
  key: string;
  active: boolean;
}

export function createChip(spec: ChipSpec): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.className = "tag-chip";
  btn.textContent = spec.label;
  btn.dataset.type = spec.type;
  btn.dataset.key = spec.key;
  if (spec.active) btn.classList.add("active");
  btn.addEventListener("mouseenter", () => {
    if (btn.classList.contains("active")) return;
    btn.style.borderColor = DEFAULT_PALETTE.accent;
    btn.style.background = "rgba(137,180,250,0.08)";
    btn.style.color = DEFAULT_PALETTE.text;
  });
  btn.addEventListener("mouseleave", () => {
    if (btn.classList.contains("active")) return;
    btn.style.borderColor = DEFAULT_PALETTE.surface2;
    btn.style.background = "transparent";
    btn.style.color = DEFAULT_PALETTE.subtext;
  });
  return btn;
}

export function setChipActive(
  chip: HTMLButtonElement,
  active: boolean,
): void {
  chip.classList.toggle("active", active);
  chip.style.borderColor = active
    ? DEFAULT_PALETTE.accent
    : DEFAULT_PALETTE.surface2;
  chip.style.background = active
    ? "rgba(137,180,250,0.15)"
    : "transparent";
  chip.style.color = active ? DEFAULT_PALETTE.text : DEFAULT_PALETTE.subtext;
  chip.style.fontWeight = active ? "500" : "400";
}

export function clearCloud(
  cloud: HTMLElement,
  keep: HTMLElement,
): void {
  Array.from(cloud.children).forEach((child) => {
    if (child !== keep) child.remove();
  });
}

export function updateChipStates(
  allChip: HTMLButtonElement,
  tagChips: Map<string, HTMLButtonElement>,
  activeTag: string,
  statusChips?: Map<string, HTMLButtonElement>,
  activeStatus?: string | null,
): void {
  setChipActive(allChip, activeTag === "");
  for (const [tag, chip] of tagChips) {
    setChipActive(chip, activeTag === tag);
  }
  if (statusChips) {
    for (const [status, chip] of statusChips) {
      setChipActive(chip, activeStatus === status);
    }
  }
}
