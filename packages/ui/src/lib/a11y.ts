export function imageA11y(alt: string | undefined) {
  return alt ? { role: "img", "aria-label": alt } : { "aria-hidden": true };
}
