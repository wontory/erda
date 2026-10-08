export const CHARACTER_POSES = [
  { code: "A00", label: "기본 서기", frames: 3, frameMs: 500, zigzag: true },
  { code: "A01", label: "두 손 서기", frames: 3, frameMs: 500, zigzag: true },
  { code: "A02", label: "걷기", frames: 4, frameMs: 180, zigzag: false },
  { code: "A03", label: "두 손 걷기", frames: 4, frameMs: 180, zigzag: false },
  { code: "A11", label: "경계", frames: 3, frameMs: 500, zigzag: true },
  { code: "A07", label: "앉기", frames: 1, frameMs: 0, zigzag: false },
  { code: "A04", label: "엎드리기", frames: 1, frameMs: 0, zigzag: false },
  { code: "A06", label: "점프", frames: 1, frameMs: 0, zigzag: false },
  { code: "A05", label: "날기", frames: 2, frameMs: 300, zigzag: false },
  { code: "A08", label: "사다리", frames: 2, frameMs: 300, zigzag: false },
  { code: "A09", label: "로프", frames: 2, frameMs: 300, zigzag: false },
  { code: "A10", label: "힐", frames: 3, frameMs: 250, zigzag: false },
  { code: "A13", label: "휘두르기", frames: 3, frameMs: 250, zigzag: false },
  { code: "A24", label: "찌르기", frames: 2, frameMs: 300, zigzag: false },
  { code: "A30", label: "쏘기", frames: 3, frameMs: 250, zigzag: false },
  { code: "A35", label: "유령 서기", frames: 3, frameMs: 500, zigzag: true },
  { code: "A34", label: "유령 걷기", frames: 4, frameMs: 180, zigzag: false },
  { code: "A33", label: "쓰러짐", frames: 1, frameMs: 0, zigzag: false },
] as const;

export type CharacterPose = (typeof CHARACTER_POSES)[number];
export type CharacterPoseCode = CharacterPose["code"];

export const CHARACTER_POSE_CODES = CHARACTER_POSES.map((p) => p.code) as [CharacterPoseCode, ...CharacterPoseCode[]];

export function characterPose(code: CharacterPoseCode): CharacterPose {
  return CHARACTER_POSES.find((p) => p.code === code) ?? CHARACTER_POSES[0];
}

function frameOrder(pose: CharacterPose): number[] {
  const forward = Array.from({ length: pose.frames }, (_, i) => i);
  if (!pose.zigzag || pose.frames < 3) return forward;
  return [...forward, ...forward.slice(1, -1).reverse()];
}

function withAction(image: string, action: string): string {
  try {
    const url = new URL(image);
    url.searchParams.set("action", action);
    return url.toString();
  } catch {
    return image;
  }
}

export function characterLookFrames(image: string, code: CharacterPoseCode, animate: boolean): string[] {
  if (!image) return [];
  const pose = characterPose(code);
  const order = animate ? frameOrder(pose) : [0];
  return order.map((f) => withAction(image, `${pose.code}.${f}`));
}
