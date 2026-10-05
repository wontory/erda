export function focusScreenTitle(root: ParentNode = document) {
  root.querySelector<HTMLElement>("[data-screen-title]")?.focus({ preventScroll: true });
}
