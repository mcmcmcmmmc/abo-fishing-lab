import { useEffect, useRef, useState } from "react";
import { paintSea, paintFloat, paintReview, unproject } from "./painting";
import { type Environment, type Vec } from "./data";
import type { World, Trace } from "./engine";
export function Canvas({
  kind,
  env,
  world,
  aim,
  onAim,
  frame,
  preview = false,
}: {
  kind: "sea" | "float" | "review";
  env: Environment;
  world?: World;
  aim: Vec;
  onAim?: (p: Vec) => void;
  frame?: Trace;
  preview?: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ w: 800, h: 560 });
  useEffect(() => {
    const observer = new ResizeObserver(([e]) =>
      setSize({ w: e.contentRect.width, h: e.contentRect.height }),
    );
    observer.observe(ref.current!);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const el = ref.current!,
      dpr = Math.min(devicePixelRatio || 1, 2);
    el.width = size.w * dpr;
    el.height = size.h * dpr;
    const c = el.getContext("2d")!;
    c.scale(dpr, dpr);
    if (kind === "float" && world) paintFloat(c, size.w, size.h, world);
    else if (kind === "review" && world)
      paintReview(c, size.w, size.h, world, frame);
    else
      paintSea(c, size.w, size.h, env, world?.time ?? 0, aim, world, preview);
  }, [kind, env, world, aim, frame, preview, size]);
  return (
    <canvas
      ref={ref}
      className={`field-canvas ${kind} ${preview ? "preview" : ""}`}
      role={onAim ? "application" : "img"}
      aria-label={
        kind === "sea"
          ? "海岸实战场景，点击选择抛投或撒饵落点；方向键微调"
          : kind === "float"
            ? "独立漂相观察窗，仅展示水面可见的漂相"
            : "本竿鱼群分布和钩饵轨迹复盘"
      }
      tabIndex={onAim ? 0 : undefined}
      onClick={(e) => {
        if (!onAim) return;
        const r = e.currentTarget.getBoundingClientRect();
        onAim(unproject(e.clientX - r.left, e.clientY - r.top, size.w, size.h));
      }}
      onKeyDown={(e) => {
        if (
          onAim &&
          ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)
        ) {
          e.preventDefault();
          onAim({
            x: Math.max(
              -18,
              Math.min(
                18,
                aim.x +
                  (e.key === "ArrowLeft" ? -1 : e.key === "ArrowRight" ? 1 : 0),
              ),
            ),
            y: Math.max(
              12,
              Math.min(
                47,
                aim.y +
                  (e.key === "ArrowUp" ? 1 : e.key === "ArrowDown" ? -1 : 0),
              ),
            ),
            z: 0,
          });
        }
      }}
    />
  );
}
