import { useEffect, useRef, useState } from "react";
import { drawOcean, unmapX, type Hit, type Part } from "./draw";
import { clamp, type World } from "./model";
export function Ocean({
  world,
  xray,
  aim,
  onAim,
  reference,
  selected,
  onSelect,
}: {
  world: World;
  xray: boolean;
  aim: number;
  onAim: (n: number) => void;
  reference: boolean;
  selected: Part | null;
  onSelect: (id: Part) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null),
    hits = useRef<Hit[]>([]),
    [size, setSize] = useState({ w: 900, h: 540 });
  useEffect(() => {
    const el = canvas.current!;
    const observer = new ResizeObserver(([entry]) => {
      setSize({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const el = canvas.current!,
      dpr = Math.min(window.devicePixelRatio || 1, 2);
    el.width = size.w * dpr;
    el.height = size.h * dpr;
    const ctx = el.getContext("2d")!;
    ctx.scale(dpr, dpr);
    hits.current = drawOcean(ctx, size.w, size.h, world, {
      xray,
      aim,
      reference,
      selected,
      labels: true,
    });
  }, [world, size, xray, aim, reference, selected]);
  return (
    <canvas
      ref={canvas}
      className="ocean-canvas"
      tabIndex={0}
      role="application"
      aria-label="钓鱼模拟场景。点击海面选择落点；左右方向键也可调整落点。在透视模式中点击阿波、咬铅、钩饵查看作用。"
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          e.preventDefault();
          onAim(clamp(aim + (e.key === "ArrowLeft" ? -1 : 1), 10, 32));
        }
      }}
      onClick={(e) => {
        const box = e.currentTarget.getBoundingClientRect(),
          x = e.clientX - box.left,
          y = e.clientY - box.top;
        const part = hits.current.find(
          (h) => Math.hypot(h.x - x, h.y - y) < 23,
        );
        if (part) onSelect(part.part);
        else onAim(clamp(unmapX(x, size.w), 10, 32));
      }}
    />
  );
}
