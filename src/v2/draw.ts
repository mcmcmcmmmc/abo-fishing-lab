import {
  bottomAt,
  rigModel,
  WORLD_WIDTH,
  WATER_DEPTH,
  type World,
} from "./model";
export type Part = "float" | "shot" | "hook";
export interface Hit {
  part: Part;
  x: number;
  y: number;
}
export interface RenderOptions {
  xray: boolean;
  aim: number;
  reference: boolean;
  selected: Part | null;
  labels: boolean;
}
export const mapX = (x: number, width: number) =>
  55 + (x / WORLD_WIDTH) * (width - 90);
export const unmapX = (x: number, width: number) =>
  ((x - 55) / (width - 90)) * WORLD_WIDTH;
function curve(
  ctx: CanvasRenderingContext2D,
  points: number[][],
  color: string,
  line = 1,
) {
  ctx.beginPath();
  points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.strokeStyle = color;
  ctx.lineWidth = line;
  ctx.stroke();
}
function text(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  color = "#c1e6e6",
  size = 12,
  align: CanvasTextAlign = "left",
) {
  ctx.font = `${size}px -apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(value, x, y);
}
function fish(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  direction: number,
  color: string,
  opacity = 1,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(direction, 1);
  ctx.globalAlpha = opacity;
  ctx.beginPath();
  ctx.moveTo(size, 0);
  ctx.bezierCurveTo(
    size * 0.2,
    -size * 0.64,
    -size * 0.6,
    -size * 0.52,
    -size,
    0,
  );
  ctx.bezierCurveTo(
    -size * 0.5,
    size * 0.55,
    size * 0.35,
    size * 0.47,
    size,
    0,
  );
  ctx.fillStyle = color;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-size * 0.85, 0);
  ctx.lineTo(-size * 1.45, -size * 0.44);
  ctx.quadraticCurveTo(-size * 1.22, 0, -size * 1.45, size * 0.44);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-size * 0.45, -size * 0.34);
  ctx.lineTo(-size * 0.21, -size * 0.7);
  ctx.lineTo(size * 0.3, -size * 0.3);
  ctx.fill();
  ctx.strokeStyle = "#052e4090";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(size * 0.34, 0, size * 0.13, size * 0.28, 0, -1.4, 1.4);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(size * 0.68, -size * 0.12, 1.6, 0, Math.PI * 2);
  ctx.fillStyle = "#082c39";
  ctx.fill();
  ctx.restore();
}
function float(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale = 1,
  alpha = 1,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.globalAlpha = alpha;
  const g = ctx.createLinearGradient(-10, 0, 12, 0);
  g.addColorStop(0, "#ff7149");
  g.addColorStop(0.55, "#ffb16b");
  g.addColorStop(1, "#d55a3b");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, -21);
  ctx.bezierCurveTo(-15, -10, -16, 10, -4, 17);
  ctx.quadraticCurveTo(0, 20, 4, 17);
  ctx.bezierCurveTo(16, 10, 15, -10, 0, -21);
  ctx.fill();
  ctx.fillStyle = "#ffeaca";
  ctx.fillRect(-11, 4, 22, 4);
  ctx.strokeStyle = "#ffc796";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-5, -8);
  ctx.lineTo(-2, -15);
  ctx.stroke();
  ctx.restore();
}
function pill(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  accent = false,
) {
  ctx.save();
  ctx.font = "12px -apple-system, 'PingFang SC', sans-serif";
  const width = ctx.measureText(value).width + 22;
  ctx.fillStyle = accent ? "#f8a971" : "#073449de";
  ctx.beginPath();
  ctx.roundRect(x, y - 18, width, 28, 7);
  ctx.fill();
  text(ctx, value, x + 11, y, accent ? "#152b37" : "#d2e6e6", 12);
  ctx.restore();
}
export function drawOcean(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  w: World,
  o: RenderOptions,
): Hit[] {
  ctx.clearRect(0, 0, width, height);
  const surface = height * 0.285,
    depthScale = (height - surface - 46) / WATER_DEPTH;
  const X = (x: number) => mapX(x, width),
    Y = (depth: number) => surface + depth * depthScale;
  const p = w.setup,
    rig = rigModel(p),
    t = w.time;
  const waveStrength =
    p.wave + (w.mode === "challenge" && w.cause === "wave" && t > 8 ? 0.52 : 0);
  const floatX = X(w.float.x + w.side),
    water = (x: number) =>
      surface +
      Math.sin(t * 2.1 + (x - floatX) * 0.014) *
        waveStrength *
        depthScale *
        0.5;
  const floatY =
    water(floatX) +
    w.float.depth * depthScale +
    w.dip * depthScale +
    (1 - rig.exposure) * 21 -
    10;
  const hookX = X(w.hook.x),
    hookY = Y(w.hook.depth);
  const sea = ctx.createLinearGradient(0, surface, 0, height);
  sea.addColorStop(0, o.xray ? "#116b80" : "#23778a");
  sea.addColorStop(0.6, o.xray ? "#084558" : "#125064");
  sea.addColorStop(1, "#072b40");
  ctx.fillStyle = sea;
  ctx.fillRect(0, 0, width, height);
  const sky = ctx.createLinearGradient(0, 0, 0, surface);
  sky.addColorStop(0, "#82b5c5");
  sky.addColorStop(1, "#d8e8e2");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, surface);
  const sun = ctx.createRadialGradient(
    width * 0.67,
    32,
    5,
    width * 0.67,
    32,
    140,
  );
  sun.addColorStop(0, "#fff0c888");
  sun.addColorStop(1, "#fff0c800");
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, width, surface);
  ctx.fillStyle = "#76a6b8";
  ctx.beginPath();
  ctx.moveTo(0, surface - 48);
  [
    [0, surface - 60],
    [width * 0.13, surface - 83],
    [width * 0.24, surface - 58],
    [width * 0.33, surface - 71],
    [width * 0.44, surface - 52],
    [width, surface - 47],
    [width, surface],
    [0, surface],
  ].forEach(([x, y]) => ctx.lineTo(x, y));
  ctx.fill();
  ctx.fillStyle = "#609aaa";
  ctx.beginPath();
  ctx.moveTo(width * 0.73, surface - 42);
  ctx.lineTo(width * 0.82, surface - 64);
  ctx.lineTo(width * 0.9, surface - 76);
  ctx.lineTo(width, surface - 55);
  ctx.lineTo(width, surface);
  ctx.fill();
  // Open-water horizon and surface strip stay visible when the water is cut away.
  const upperSea = ctx.createLinearGradient(0, surface - 45, 0, surface + 1);
  upperSea.addColorStop(0, "#428e9e");
  upperSea.addColorStop(1, "#1c7588");
  ctx.fillStyle = upperSea;
  ctx.fillRect(0, surface - 45, width, 46);
  for (let row = 0; row < 5; row++) {
    const y = surface - 38 + row * 8;
    curve(
      ctx,
      Array.from({ length: 34 }, (_, i) => [
        (i * width) / 33,
        y + Math.sin(i * 0.5 + t * 0.7 + row) * 1.4,
      ]),
      "#bddcd929",
      1,
    );
  }
  if (o.xray) {
    // Slowly moving underwater light, depth marks and flow tracers establish one shared space.
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, surface, width, height);
    ctx.clip();
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      const x = width * (0.22 + i * 0.17) + Math.sin(t * 0.13 + i) * 13;
      ctx.moveTo(x, surface);
      ctx.lineTo(x + 36, surface);
      ctx.lineTo(x + 140, height);
      ctx.lineTo(x + 10, height);
      ctx.closePath();
      ctx.fillStyle = "#72d8d905";
      ctx.fill();
    }
    for (let depth = 1; depth <= 7; depth++) {
      const y = Y(depth);
      curve(
        ctx,
        [
          [width - 43, y],
          [width - 25, y],
        ],
        "#5fb5c155",
      );
      if (depth % 2 === 0)
        text(ctx, `${depth}m`, width - 49, y + 4, "#8fbdc6", 11, "right");
    }
    for (let i = 0; i < 28; i++) {
      const band = i % 7;
      const travel = (t * p.flow * 20 + i * 83) % (width + 100);
      const y = Y(0.8 + band * 0.83) + Math.sin(t * 0.5 + i) * 5;
      curve(
        ctx,
        [
          [travel - 25, y],
          [travel, y],
        ],
        "#87d8db24",
        1,
      );
      if (i % 5 === 0)
        curve(
          ctx,
          [
            [travel - 5, y - 3],
            [travel, y],
            [travel - 5, y + 3],
          ],
          "#87d8db4d",
          1,
        );
    }
    // Terrain is sampled from the same seabed function used by the simulation.
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let i = 0; i <= 100; i++) {
      const x = (i * WORLD_WIDTH) / 100;
      ctx.lineTo(X(x), Y(bottomAt(x)));
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    const floor = ctx.createLinearGradient(0, height - 110, 0, height);
    floor.addColorStop(0, "#214755");
    floor.addColorStop(1, "#0e2d3b");
    ctx.fillStyle = floor;
    ctx.fill();
    for (let i = 0; i < 35; i++) {
      const x = 3 + i * 1.07;
      const px = X(x),
        py = Y(bottomAt(x));
      const len = 8 + (i % 5) * 4;
      curve(
        ctx,
        [
          [px, py],
          [px + Math.sin(t * 0.9 + i) * 3, py - len * 0.6],
          [px + Math.sin(t * 0.9 + i) * 6, py - len],
        ],
        "#306d6c",
        1.2,
      );
    }
    for (let i = 0; i < 7; i++) {
      const x = 26 + Math.sin(t * 0.22 + i * 0.8) * 4 + i * 0.35;
      fish(
        ctx,
        X(x),
        Y(3.4 + (i % 3) * 0.6) + Math.sin(t * 0.6 + i) * 4,
        7 + (i % 3),
        Math.cos(t * 0.22 + i * 0.8) > 0 ? 1 : -1,
        "#5b9aa8",
        0.42,
      );
    }
    if (w.particles.length > 0) {
      for (const part of w.particles) {
        const alpha = Math.max(0.15, 1 - part.age / 28);
        ctx.fillStyle = `rgba(248,204,137,${alpha * 0.72})`;
        ctx.beginPath();
        ctx.arc(
          X(part.x),
          Y(part.depth),
          1.2 + (part.seed % 3) * 0.4,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    }
    if (w.trail.length > 1)
      curve(
        ctx,
        w.trail.map((v) => [X(v.x), Y(v.depth)]),
        "#ffc79055",
        1.4,
      );
    if (o.reference) {
      ctx.setLineDash([4, 6]);
      curve(
        ctx,
        [
          [floatX, Y(0)],
          [floatX, Y(p.depth)],
        ],
        "#bce8e177",
        1,
      );
      ctx.setLineDash([]);
      if (width > 550)
        text(
          ctx,
          "无流时的垂直参照",
          floatX - 14,
          Y(p.depth) + 22,
          "#8ac3c6",
          11,
          "right",
        );
    }
    ctx.restore();
  } else {
    for (let i = 0; i < 20; i++) {
      const y = surface + (i / 20) ** 1.6 * (height - surface);
      const amp = 2 + i * 0.17 + waveStrength * 5;
      curve(
        ctx,
        Array.from({ length: 35 }, (_, j) => [
          (j * width) / 34,
          y + Math.sin(j * 0.7 + t * 2.1 + i * 0.23) * amp,
        ]),
        `rgba(122,197,200,${0.07 + (i % 3) * 0.025})`,
        1,
      );
    }
    const reflection = ctx.createLinearGradient(
      width * 0.7,
      surface,
      width * 0.7,
      height,
    );
    reflection.addColorStop(0, "#c9e4cf18");
    reflection.addColorStop(1, "#86c5c500");
    ctx.fillStyle = reflection;
    ctx.beginPath();
    ctx.moveTo(width * 0.62, surface);
    ctx.lineTo(width * 0.71, surface);
    ctx.lineTo(width * 0.85, height);
    ctx.lineTo(width * 0.35, height);
    ctx.fill();
  }
  // Shore cut and rod remain the fixed physical reference.
  ctx.fillStyle = "#173845";
  ctx.beginPath();
  ctx.moveTo(0, surface - 36);
  ctx.lineTo(35, surface - 29);
  ctx.lineTo(60, surface - 7);
  ctx.lineTo(70, surface + 32);
  ctx.lineTo(38, surface + 62);
  ctx.lineTo(18, height);
  ctx.lineTo(0, height);
  ctx.fill();
  ctx.strokeStyle = "#90a9a3";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(8, surface - 8);
  ctx.quadraticCurveTo(48, surface - 68, 106, surface - 86);
  ctx.stroke();
  // Landing marker can be positioned independently from the float.
  const aimX = X(o.aim);
  ctx.save();
  ctx.setLineDash([3, 5]);
  curve(
    ctx,
    [
      [aimX, surface - 9],
      [aimX, surface + 18],
    ],
    "#dae7df88",
  );
  ctx.setLineDash([]);
  ctx.strokeStyle = "#d3dfd3aa";
  ctx.beginPath();
  ctx.ellipse(aimX, surface, 18, 4, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  if (width > 520)
    text(
      ctx,
      `${o.aim.toFixed(0)}m 落点`,
      aimX,
      surface - 18,
      "#edf1df",
      11,
      "center",
    );
  const lineBend =
    w.mode === "challenge" && w.cause === "wind" && t > 8 ? 32 : 8 + p.wind * 2;
  ctx.strokeStyle = "#d4e5d388";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(106, surface - 86);
  ctx.quadraticCurveTo((floatX + 106) / 2, surface + lineBend, floatX, floatY);
  ctx.stroke();
  const middleX = (floatX + hookX) / 2 + Math.max(0, 3 - w.tension) * 7;
  const shotX = floatX * 0.24 + hookX * 0.76,
    shotY = floatY * 0.24 + hookY * 0.76;
  if (o.xray) {
    ctx.strokeStyle = "#d5e9d5cc";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(floatX, floatY);
    ctx.quadraticCurveTo(middleX, (floatY + hookY) / 2, hookX, hookY);
    ctx.stroke();
    ctx.fillStyle = "#8bc8c4";
    ctx.beginPath();
    ctx.moveTo(floatX + 1, floatY + 24);
    ctx.lineTo(floatX - 4, floatY + 17);
    ctx.lineTo(floatX + 6, floatY + 17);
    ctx.fill();
    if (p.shot > 0.02) {
      ctx.fillStyle = "#afbeb5";
      ctx.beginPath();
      ctx.arc(shotX, shotY, 2.5 + p.shot * 1.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#203f46";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(shotX - 2, shotY - 3);
      ctx.lineTo(shotX + 3, shotY + 3);
      ctx.stroke();
    }
    ctx.strokeStyle = "#f2e4c4";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(hookX, hookY - 7);
    ctx.lineTo(hookX, hookY + 4);
    ctx.quadraticCurveTo(hookX + 8, hookY + 11, hookX + 8, hookY + 1);
    ctx.stroke();
    ctx.fillStyle = "#efac85";
    ctx.beginPath();
    ctx.ellipse(hookX + 4, hookY + 1, 5, 3, 0.6, 0, Math.PI * 2);
    ctx.fill();
    const near =
      distanceInPixels(X(w.fish.x), Y(w.fish.depth), hookX, hookY) < 30;
    fish(
      ctx,
      X(w.fish.x) + Math.sin(t * 2) * 0.6,
      Y(w.fish.depth),
      near ? 15 : 18,
      w.fish.direction,
      "#9bb9b6",
    );
    if (w.fish.phase === "bite" || w.fish.phase === "carry") {
      ctx.strokeStyle = "#f8c488";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(hookX + 4, hookY, 9 + Math.sin(t * 4) * 1.5, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (w.bottom) {
      ctx.strokeStyle = "#f5bd8b";
      ctx.beginPath();
      ctx.arc(hookX, hookY, 14, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (o.labels && t > 1.15) {
      if (Math.abs(hookX - floatX) > 18) {
        ctx.setLineDash([3, 4]);
        curve(
          ctx,
          [
            [floatX, hookY + 23],
            [hookX, hookY + 23],
          ],
          "#a0d2ce99",
        );
        ctx.setLineDash([]);
        text(
          ctx,
          `偏移 ${Math.abs(w.hook.x - w.float.x).toFixed(1)}m`,
          (hookX + floatX) / 2,
          hookY + 43,
          "#c1e4df",
          12,
          "center",
        );
      }
      pill(
        ctx,
        `钩饵 · ${w.hook.depth.toFixed(1)}m`,
        Math.min(width - 151, hookX + 23),
        hookY - 1,
      );
      if (width > 650)
        pill(
          ctx,
          `${p.shot.toFixed(1)}g`,
          Math.min(width - 92, shotX + 18),
          shotY - 11,
        );
    }
  }
  // A float is bright above water, translucent below in X-ray, and fully occluded otherwise.
  if (o.xray) float(ctx, floatX, floatY, 1, 0.35);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(width, 0);
  for (let i = 100; i >= 0; i--)
    ctx.lineTo((i * width) / 100, water((i * width) / 100));
  ctx.closePath();
  ctx.clip();
  float(ctx, floatX, floatY, 1);
  ctx.restore();
  curve(
    ctx,
    Array.from({ length: 100 }, (_, i) => [
      (i * width) / 99,
      water((i * width) / 99),
    ]),
    "#a2e1ded9",
    1.2,
  );
  ctx.strokeStyle = "#9ce4e07a";
  ctx.beginPath();
  ctx.ellipse(
    floatX,
    water(floatX) + 2,
    20 + Math.sin(t * 3) * 2,
    3.2,
    0,
    0,
    Math.PI * 2,
  );
  ctx.stroke();
  const hits: Hit[] = [
    { part: "float", x: floatX, y: floatY },
    ...(o.xray
      ? [
          { part: "shot" as Part, x: shotX, y: shotY },
          { part: "hook" as Part, x: hookX, y: hookY },
        ]
      : []),
  ];
  const picked = hits.find((h) => h.part === o.selected);
  if (picked) {
    ctx.strokeStyle = "#ffe0a9";
    ctx.lineWidth = 1.3;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(picked.x, picked.y, 24, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  // A magnified surface view uses exactly the same wave and immersion as the main float.
  const lw = width < 600 ? 126 : 172,
    lx = width - lw - 18,
    ly = 64,
    lh = 104;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(lx, ly, lw, lh, 12);
  ctx.clip();
  ctx.fillStyle = "#062d42ee";
  ctx.fillRect(lx, ly, lw, lh);
  text(ctx, "漂相放大镜", lx + 14, ly + 22, "#a7d7dd", 12);
  const localY = ly + 72,
    localX = lx + lw * 0.5 + w.side * 7;
  ctx.fillStyle = "#d4e6dc";
  ctx.fillRect(lx, ly + 35, lw, 37 + w.wave * 20);
  ctx.fillStyle = "#257e91";
  ctx.fillRect(lx, localY + w.wave * 20, lw, lh);
  ctx.save();
  ctx.beginPath();
  ctx.rect(lx, ly + 34, lw, localY + w.wave * 20 - ly - 34);
  ctx.clip();
  float(
    ctx,
    localX,
    localY +
      w.wave * 20 +
      (1 - rig.exposure) * 22 -
      10 +
      (w.dip + w.float.depth) * 55,
    0.94,
  );
  ctx.restore();
  curve(
    ctx,
    Array.from({ length: 20 }, (_, i) => [
      lx + (i * lw) / 19,
      localY + w.wave * 20 + Math.sin(i * 0.5 + t * 2.1) * waveStrength * 3,
    ]),
    "#b7e1db",
    1,
  );
  ctx.restore();
  text(
    ctx,
    o.xray ? "水下透视 · 距离为教学比例" : "水下已隐藏 · 只观察海面",
    22,
    height - 62,
    "#76aebb",
    10,
  );
  return hits;
}
const distanceInPixels = (a: number, b: number, c: number, d: number) =>
  Math.hypot(a - c, b - d);
