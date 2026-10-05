export function gradeColorClass(grade: string | null | undefined): string {
  switch (grade) {
    case "레전드리":
      return "text-grade-legendary";
    case "유니크":
      return "text-grade-unique";
    case "에픽":
      return "text-grade-epic";
    case "레어":
      return "text-grade-rare";
    default:
      return "text-muted-foreground";
  }
}
