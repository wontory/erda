export function isCommitEnter(e: { key: string; keyCode: number; nativeEvent: { isComposing: boolean } }): boolean {
  if (e.nativeEvent.isComposing || e.keyCode === 229) return false;
  return e.key === "Enter";
}
