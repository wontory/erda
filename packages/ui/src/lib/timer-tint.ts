export function timerTint(color: string): string {
  switch (color) {
    case "green":
      return "text-green-500";
    case "orange":
      return "text-orange-500";
    default:
      return "text-primary";
  }
}
