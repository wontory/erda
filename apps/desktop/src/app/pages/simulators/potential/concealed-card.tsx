import { m } from "motion/react";

export const CONCEALED_SURFACE =
  "bg-[repeating-linear-gradient(45deg,rgb(255_255_255/0.07)_0_1px,transparent_1px_9px),repeating-linear-gradient(-45deg,rgb(255_255_255/0.07)_0_1px,transparent_1px_9px),radial-gradient(ellipse_at_22%_18%,rgb(56_189_248/0.45),transparent_55%),radial-gradient(ellipse_at_80%_78%,rgb(14_165_233/0.35),transparent_60%),linear-gradient(160deg,#0a5cc2,#0b3f8f_60%,#0a2f6e)]";

const MOTES = [
  { x: "22%", y: "70%", size: 3, delay: 0 },
  { x: "74%", y: "62%", size: 2, delay: 0.9 },
  { x: "38%", y: "84%", size: 2, delay: 1.7 },
  { x: "62%", y: "80%", size: 3, delay: 2.4 },
  { x: "84%", y: "40%", size: 2, delay: 1.2 },
  { x: "14%", y: "44%", size: 2, delay: 3 },
];

export function ConcealedCard({ animate, onReveal }: { animate: boolean; onReveal: () => void }) {
  return (
    <m.button
      type="button"
      aria-label="목표에 도달한 결과 확인하기"
      onClick={onReveal}
      initial={animate ? { opacity: 0 } : false}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className={`group relative flex min-h-36 min-w-0 flex-col items-center justify-center overflow-hidden rounded-xl border border-sky-300/70 text-white shadow-[0_0_14px_rgb(56_189_248/0.35),inset_0_0_14px_rgb(125_211_252/0.35)] outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${CONCEALED_SURFACE}`}
    >
      {animate ? (
        <m.span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] border-2 border-sky-100 shadow-[inset_0_0_24px_rgb(186_230_253/0.9)]"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      ) : null}
      {animate
        ? MOTES.map((p, i) => (
            <m.span
              key={i}
              aria-hidden
              className="pointer-events-none absolute rounded-full bg-sky-200 shadow-[0_0_6px_2px_rgb(125_211_252/0.8)]"
              style={{ left: p.x, top: p.y, width: p.size, height: p.size }}
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: [0, 1, 0], y: -28 }}
              transition={{ duration: 2.6, delay: p.delay, repeat: Infinity, ease: "easeOut" }}
            />
          ))
        : null}
      <m.span
        aria-hidden
        className="text-[34px] leading-none font-bold transition-transform duration-200 [text-shadow:0_0_6px_rgb(186_230_253),0_0_16px_rgb(56_189_248)] group-hover:scale-110"
        animate={animate ? { opacity: [0.85, 1, 0.85] } : undefined}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        ?
      </m.span>
      <span className="absolute bottom-2 text-[11px] font-medium text-sky-100/70">눌러서 확인</span>
    </m.button>
  );
}

export function RevealFlash({ onDone }: { onDone: () => void }) {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
      <m.span
        className={`absolute inset-0 ${CONCEALED_SURFACE}`}
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.45, delay: 0.1, ease: "easeOut" }}
      />
      <m.span
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgb(255_255_255/0.95),rgb(186_230_253/0.6)_45%,transparent_80%)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 0.6, times: [0, 0.25, 1], ease: "easeOut" }}
      />
      <m.span
        className="absolute inset-0 rounded-[inherit] border-2 border-sky-100 shadow-[inset_0_0_20px_rgb(186_230_253/0.9)]"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        onAnimationComplete={onDone}
      />
    </span>
  );
}
