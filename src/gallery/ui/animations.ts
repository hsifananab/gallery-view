type AnchorEntry = { path: string; element: HTMLAnchorElement };

export function captureRects(
  grid: HTMLElement,
): Map<string, DOMRect> {
  const map = new Map<string, DOMRect>();
  Array.from(grid.children).forEach((child) => {
    const element = child as HTMLElement;
    const path = element.dataset.path;
    if (!path) return;
    map.set(path, element.getBoundingClientRect());
  });
  return map;
}

export async function animateExits(
  exiting: AnchorEntry[],
): Promise<void> {
  if (!exiting.length) return;
  for (const { element } of exiting) {
    element.classList.add("is-removing");
    element.animate(
      [
        { opacity: 1, transform: "scale(1)" },
        { opacity: 0, transform: "scale(0.96)" },
      ],
      { duration: 300, easing: "ease-out", fill: "forwards" },
    );
  }
  await new Promise((resolve) => window.setTimeout(resolve, 320));
  exiting.forEach(({ element }) => {
    element.remove();
  });
}

export function animateEntrance(
  anchor: HTMLAnchorElement,
  index: number,
  cols: number,
): void {
  const row = Math.floor(index / cols);
  const col = index % cols;
  const delay = (row * 3 + col) * 50;
  requestAnimationFrame(() => {
    anchor.animate(
      [
        { opacity: 0, transform: "scale(0.94)" },
        { opacity: 1, transform: "scale(1)" },
      ],
      {
        duration: 450,
        delay,
        easing: "cubic-bezier(.16,1,.3,1)",
        fill: "forwards",
      },
    );
  });
}

export function animateReflow(
  grid: HTMLElement,
  previousRects: Map<string, DOMRect>,
): void {
  const finalRects = captureRects(grid);
  Array.from(grid.children).forEach((child) => {
    const element = child as HTMLElement;
    const path = element.dataset.path;
    if (!path) return;
    const first = previousRects.get(path);
    const last = finalRects.get(path);
    if (!first || !last) return;
    const dx = first.left - last.left;
    const dy = first.top - last.top;
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
    element.animate(
      [
        { transform: `translate(${dx}px,${dy}px)` },
        { transform: "translate(0,0)" },
      ],
      { duration: 450, easing: "cubic-bezier(.16,1,.3,1)" },
    );
  });
}

export function buildExitingList(
  existing: Map<string, HTMLAnchorElement>,
  incomingPaths: Set<string>,
): AnchorEntry[] {
  const exiting: AnchorEntry[] = [];
  for (const [path, anchor] of existing) {
    if (!incomingPaths.has(path)) {
      exiting.push({ path, element: anchor });
    }
  }
  return exiting;
}
