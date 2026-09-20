import {
  clamp,
  ground,
  siteOf,
  SPECIES,
  type Environment,
  type Vec,
} from "./data";
import { reserve, type World, type Trace } from "./engine";
export const project = (p: Vec, w: number, h: number) => {
  const q = clamp(p.y / 60, 0, 1);
  return {
    x: w * 0.5 + (p.x * w) / (62 * (0.72 + q * 0.75)),
    y: h * 0.94 - Math.sqrt(q) * h * 0.69,
  };
};
export const unproject = (x: number, y: number, w: number, h: number): Vec => {
  const q = clamp(((h * 0.94 - y) / (h * 0.69)) ** 2, 0.2, 0.79);
  return {
    x: clamp(((x - w * 0.5) * 62 * (0.72 + q * 0.75)) / w, -18, 18),
    y: q * 60,
    z: 0,
  };
};
function path(
  c: CanvasRenderingContext2D,
  points: number[][],
  fill: string,
  stroke?: string,
) {
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fillStyle = fill;
  c.fill();
  if (stroke) {
    c.strokeStyle = stroke;
    c.stroke();
  }
}
function line(
  c: CanvasRenderingContext2D,
  p: number[][],
  stroke: string,
  width = 1,
) {
  c.beginPath();
  p.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.strokeStyle = stroke;
  c.lineWidth = width;
  c.stroke();
}
function label(
  c: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  color = "#d3e2dc",
  size = 11,
) {
  c.font = `${size}px -apple-system, 'PingFang SC', sans-serif`;
  c.fillStyle = color;
  c.fillText(s, x, y);
}
const noise = (a: number) => {
  const v = Math.sin(a * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};
export function paintSea(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  e: Environment,
  t: number,
  aim: Vec,
  world?: World,
  preview = false,
) {
  const dawn = e.time === "dawn",
    dusk = e.time === "dusk",
    warm = dawn || dusk;
  const horizon = h * 0.26;
  const sky = c.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, dusk ? "#496174" : dawn ? "#85969f" : "#719cae");
  sky.addColorStop(0.68, warm ? "#c4b7a7" : "#b0c5c8");
  sky.addColorStop(1, warm ? "#e4c7a6" : "#d1d9cd");
  c.fillStyle = sky;
  c.fillRect(0, 0, w, horizon + 8);
  const sx = w * 0.72,
    sy = horizon * (dusk ? 0.78 : dawn ? 0.68 : 0.26);
  const halo = c.createRadialGradient(sx, sy, 2, sx, sy, w * 0.22);
  halo.addColorStop(0, "#ffe6b879");
  halo.addColorStop(0.25, "#ffe7c536");
  halo.addColorStop(1, "#ffe0af00");
  c.fillStyle = halo;
  c.fillRect(0, 0, w, horizon);
  c.fillStyle = warm ? "#ffe1aa" : "#f5ead0";
  c.beginPath();
  c.arc(sx, sy, warm ? 10 : 6, 0, Math.PI * 2);
  c.fill();
  for (let i = 0; i < 8; i++) {
    const y = 15 + noise(i + 5) * horizon * 0.63,
      x = noise(i + 40) * w,
      ww = 80 + noise(i + 60) * 160;
    c.fillStyle = e.sea === "rough" ? "#71858930" : "#f0e7d61b";
    c.beginPath();
    c.ellipse(
      x + Math.sin(t * 0.005) * 8,
      y,
      ww,
      6 + noise(i + 9) * 9,
      -0.05,
      0,
      6.29,
    );
    c.fill();
  }
  const island = (left: number, span: number, lift: number, col: string) => {
    const pts = [[left, horizon + 1]];
    for (let i = 0; i <= 40; i++) {
      const u = i / 40;
      pts.push([
        left + span * u,
        horizon - Math.sin(u * Math.PI) * lift * (0.75 + noise(i + 6) * 0.25),
      ]);
    }
    pts.push([left + span, horizon + 1]);
    path(c, pts, col);
  };
  island(-w * 0.1, w * 0.6, h * 0.075, "#6c8586");
  island(w * 0.77, w * 0.32, h * 0.045, "#80928f");
  if (e.site === "harbor") island(w * 0.02, w * 0.3, h * 0.12, "#516f73");
  const water = c.createLinearGradient(0, horizon, 0, h);
  water.addColorStop(
    0,
    e.site === "inlet" ? "#899786" : warm ? "#8eaaac" : "#759ba7",
  );
  water.addColorStop(0.18, siteOf(e).tint);
  water.addColorStop(0.65, e.site === "inlet" ? "#3d605b" : "#245766");
  water.addColorStop(1, "#183b48");
  c.fillStyle = water;
  c.fillRect(0, horizon, w, h - horizon);
  // Perspective-scaled, layered wave crests; no float object is painted here.
  for (let row = 0; row < 115; row++) {
    const q = row / 115,
      y = horizon + q * q * (h - horizon),
      amp = (0.4 + q * q * 9) * (e.wave * 1.9 + 0.3);
    const pts = [];
    for (let j = 0; j <= 60; j++) {
      const x = (j * w) / 60;
      pts.push([
        x,
        y +
          Math.sin(x / (22 + q * 66) + t * (1.1 + q * 0.6) + row * 0.65) * amp +
          Math.sin(x / (9 + q * 28) - t * 0.7) * amp * 0.24,
      ]);
    }
    line(
      c,
      pts,
      row % 4 === 0
        ? `rgba(187,215,210,${0.08 + q * 0.14})`
        : `rgba(11,43,53,${0.035 + q * 0.07})`,
      0.5 + q * 1.2,
    );
    if (row % 3 === 0) {
      const center = sx + Math.sin(row * 1.6) * q * 55;
      const shimmer = 20 + q * q * w * 0.16;
      c.strokeStyle = `rgba(244,219,166,${warm ? 0.18 : 0.08})`;
      c.lineWidth = 0.8 + q;
      c.beginPath();
      c.moveTo(center - shimmer * noise(row + 2), y);
      c.lineTo(center + shimmer * noise(row + 20), y);
      c.stroke();
    }
  }
  // Small breaking crests are tied to wave energy, never to a fish event.
  for (let i = 0; i < 35; i++) {
    const px = noise(i + 50) * w,
      py = horizon + noise(i + 220) ** 0.45 * (h - horizon);
    const life = (Math.sin(t * 1.4 + i * 2) + 1) / 2;
    const q = (py - horizon) / (h - horizon);
    if (life > 0.58)
      line(
        c,
        [
          [px, py],
          [px + q * 8, py - 1],
          [px + q * 16, py],
        ],
        `rgba(215,230,219,${life * e.wave * 0.6})`,
        1,
      );
  }
  if (e.site === "inlet") {
    for (let i = 0; i < 12; i++) {
      const y = h * 0.35 + i * h * 0.04;
      line(
        c,
        [
          [w * 0.35, y],
          [w * 0.38, y - 3],
          [w * 0.46, y - 2],
        ],
        "#c7d8b411",
        2,
      );
    }
  }
  if (world) {
    for (const p of world.pellets) {
      if (p.z > 0.45) continue;
      const pp = project(p, w, h);
      c.fillStyle = `rgba(228,203,157,${0.7 - p.z})`;
      c.fillRect(pp.x, pp.y, 2, 1);
    }
    for (const f of world.fish) {
      if (f.z > 0.45 || f.state === "landed") continue;
      const pp = project(f, w, h);
      c.strokeStyle = "#c4d9cf66";
      c.beginPath();
      c.ellipse(pp.x, pp.y, 8 + Math.sin(t * 3) * 2, 2, 0, 0, 6.29);
      c.stroke();
    }
  }
  // Near-shore geometry establishes the player's standing point.
  if (e.site === "harbor") {
    path(
      c,
      [
        [0, h * 0.54],
        [w * 0.07, h * 0.63],
        [w * 0.15, h],
        [0, h],
      ],
      "#444e4d",
    );
    path(
      c,
      [
        [0, h * 0.54],
        [w * 0.075, h * 0.6],
        [w * 0.11, h * 0.89],
        [w * 0.15, h],
        [w * 0.06, h],
        [0, h * 0.68],
      ],
      "#6f7770",
    );
    for (let i = 0; i < 5; i++) {
      const y = h * (0.6 + i * 0.095);
      line(
        c,
        [
          [0, y],
          [w * (0.04 + i * 0.018), y + h * 0.02],
        ],
        "#343f40",
        2,
      );
    }
    line(
      c,
      [
        [w * 0.018, h * 0.57],
        [w * 0.06, h * 0.78],
        [w * 0.08, h],
      ],
      "#373e3c",
      3,
    );
  } else {
    path(
      c,
      [
        [0, h * 0.65],
        [w * 0.025, h * 0.58],
        [w * 0.063, h * 0.61],
        [w * 0.1, h * 0.77],
        [w * 0.09, h * 0.86],
        [w * 0.21, h],
        [0, h],
      ],
      "#283e43",
    );
    path(
      c,
      [
        [0, h * 0.66],
        [w * 0.025, h * 0.58],
        [w * 0.063, h * 0.61],
        [w * 0.085, h * 0.72],
        [w * 0.04, h * 0.73],
        [w * 0.065, h * 0.87],
        [0, h * 0.91],
      ],
      "#556361",
    );
    path(
      c,
      [
        [w * 0.063, h * 0.77],
        [w * 0.08, h * 0.83],
        [w * 0.095, h * 0.82],
        [w * 0.18, h * 0.96],
        [w * 0.13, h],
        [w * 0.048, h * 0.95],
      ],
      "#3c504f",
    );
    for (let i = 0; i < 18; i++) {
      const py = h * (0.68 + noise(i + 3) * 0.32),
        px = noise(i + 5) * w * 0.065;
      line(
        c,
        [
          [px, py],
          [px + w * 0.025, py - 7],
          [px + w * 0.041, py + 3],
        ],
        "#82928a22",
        1,
      );
    }
    const foam = h * 0.78 + Math.sin(t * 1.5) * 8 * e.wave;
    line(
      c,
      [
        [w * 0.1, foam],
        [w * 0.12, foam + 9],
        [w * 0.15, foam + 5],
      ],
      "#d2ddd474",
      2,
    );
  }
  const vignette = c.createRadialGradient(
    w * 0.5,
    h * 0.42,
    w * 0.1,
    w * 0.5,
    h * 0.5,
    w * 0.76,
  );
  vignette.addColorStop(0, "#00172400");
  vignette.addColorStop(1, "#041c344a");
  c.fillStyle = vignette;
  c.fillRect(0, 0, w, h);
  if (!preview) {
    const ap = project(aim, w, h);
    c.save();
    c.setLineDash([3, 5]);
    c.strokeStyle = "#ead7ab9c";
    c.lineWidth = 1;
    c.beginPath();
    c.ellipse(ap.x, ap.y, 13, 4, 0, 0, Math.PI * 2);
    c.stroke();
    c.setLineDash([]);
    line(
      c,
      [
        [ap.x, ap.y - 11],
        [ap.x, ap.y + 10],
      ],
      "#f3ddb68a",
    );
    c.restore();
    label(
      c,
      `${Math.hypot(aim.x, aim.y).toFixed(0)} m`,
      ap.x + 18,
      ap.y + 4,
      "#e5dec7",
      11,
    );
    if (world && (world.phase === "fishing" || world.phase === "fight")) {
      const fp = project(world.float, w, h);
      c.strokeStyle = "#d2d6bf75";
      c.lineWidth = 0.8;
      c.beginPath();
      c.moveTo(w * 0.39, h * 0.77);
      c.quadraticCurveTo(
        (w * 0.39 + fp.x) / 2 +
          (world.lineLength - Math.hypot(world.float.x, world.float.y)) * 5,
        h * 0.6,
        fp.x,
        fp.y,
      );
      c.stroke();
      c.strokeStyle = "#ecdec082";
      c.beginPath();
      c.ellipse(fp.x, fp.y, 5, 1.5, 0, 0, 6.29);
      c.stroke();
    }
    const bent = world ? Math.min(35, world.tension * 2) : 0;
    c.strokeStyle = "#0a1c25";
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(w * 0.22, h + 10);
    c.quadraticCurveTo(w * 0.27, h * 0.8, w * 0.39, h * 0.77 + bent);
    c.stroke();
    c.strokeStyle = "#bdab833e";
    c.lineWidth = 1;
    c.stroke();
  }
}
export function paintFloat(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  world: World,
) {
  const t = world.time,
    amp = world.env.wave;
  const horizon = h * 0.49;
  const active = world.phase === "fishing" || world.phase === "fight";
  const sky = c.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#a3babe");
  sky.addColorStop(0.5, "#d0d6c3");
  sky.addColorStop(1, "#497a84");
  c.fillStyle = sky;
  c.fillRect(0, 0, w, h);
  const waterY = horizon + Math.sin(t * 1.7) * amp * 22;
  const dip = active ? world.floatDip : 0;
  const ratio = active
    ? clamp(reserve(world) / world.tackle.float, -0.5, 0.9)
    : 0.38;
  const fy =
    waterY +
    (1 - ratio) * 19 -
    5 +
    dip * 64 +
    Math.sin(t * 1.7 - 0.18) * amp * 8;
  const fx =
    w * 0.5 + Math.sin(t * 0.5) * 2 + (active ? world.floatTilt * 0.3 : 0);
  const drawBuoy = () => {
    c.save();
    c.translate(fx, fy);
    c.rotate(((active ? world.floatTilt : 0) * Math.PI) / 180);
    const g = c.createLinearGradient(-14, 0, 14, 0);
    g.addColorStop(0, "#b94621");
    g.addColorStop(0.28, "#f57830");
    g.addColorStop(0.6, "#fda751");
    g.addColorStop(1, "#a94827");
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(0, -28);
    c.bezierCurveTo(-16, -16, -18, 13, -6, 23);
    c.quadraticCurveTo(0, 29, 6, 23);
    c.bezierCurveTo(18, 13, 16, -16, 0, -28);
    c.fill();
    c.fillStyle = "#ede1b9";
    c.fillRect(-14, 7, 28, 4);
    c.strokeStyle = "#ffe0a7";
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(-5, -9);
    c.lineTo(-2, -21);
    c.stroke();
    c.restore();
  };
  drawBuoy();
  c.beginPath();
  c.moveTo(0, h);
  c.lineTo(0, waterY);
  for (let x = 0; x <= w; x += 4)
    c.lineTo(x, waterY + Math.sin(x * 0.047 + t * 1.7) * amp * 5);
  c.lineTo(w, h);
  c.closePath();
  const sea = c.createLinearGradient(0, waterY, 0, h);
  sea.addColorStop(0, "#42798a");
  sea.addColorStop(1, "#1d485b");
  c.fillStyle = sea;
  c.fill();
  for (let i = 0; i < 9; i++) {
    const y = waterY + 9 + i * i * 1.15;
    const p = Array.from({ length: 31 }, (_, j) => [
      (j * w) / 30,
      y + Math.sin(j * 0.5 + t * 1.8 + i) * amp * 5,
    ]);
    line(c, p, i % 2 ? "#81b7be39" : "#123e501f", 1);
  }
  c.strokeStyle = "#cbe2d970";
  c.beginPath();
  c.ellipse(fx, waterY + 2, 19 + Math.sin(t * 3) * 2, 3, 0, 0, 6.29);
  c.stroke();
  if (!active) {
    c.fillStyle = "#0b24364a";
    c.fillRect(0, 0, w, h);
    label(
      c,
      world.phase === "ready" ? "抛竿后开始观察" : "本竿结束",
      12,
      h - 15,
      "#dce6dd",
      11,
    );
  }
}
export function paintReview(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  world: World,
  frame: Trace | undefined,
) {
  c.fillStyle = "#102d36";
  c.fillRect(0, 0, w, h);
  const mx = (x: number) => w * 0.5 + (x * (w - 40)) / 54,
    my = (y: number) => h - 24 - (y * (h - 50)) / 60;
  for (let row = 0; row < 60; row++)
    for (let col = 0; col < 54; col++) {
      const x = col - 27,
        y = row;
      const d = ground(world.env, x, y);
      c.fillStyle = `hsl(${184 + d * 2} 29% ${24 - d * 1.15}%)`;
      c.fillRect(mx(x), my(y + 1), (w - 40) / 54 + 1, (h - 50) / 60 + 1);
    }
  for (let i = 1; i <= 10; i++) {
    c.strokeStyle = "#bbd8d510";
    c.beginPath();
    for (let j = 0; j < 54; j++) {
      const x = j - 27;
      for (let y = 2; y < 60; y += 0.6) {
        const d = ground(world.env, x, y);
        if (Math.abs(d - i) < 0.09) {
          c.moveTo(mx(x), my(y));
          c.lineTo(mx(x + 1), my(y));
        }
      }
    }
    c.stroke();
  }
  for (const o of siteOf(world.env).obstacles) {
    c.strokeStyle = o.kind === "rock" ? "#c6b28d66" : "#9abe8350";
    c.beginPath();
    c.ellipse(
      mx(o.x),
      my(o.y),
      (o.radius * (w - 40)) / 54,
      (o.radius * (h - 50)) / 60,
      0,
      0,
      6.29,
    );
    c.stroke();
  }
  const selected = frame ?? world.trace.at(-1),
    upTo = world.trace.filter((s) => !selected || s.t <= selected.t);
  line(
    c,
    upTo.map((s) => [mx(s.float.x), my(s.float.y)]),
    "#91c9c5",
    1.5,
  );
  line(
    c,
    upTo.map((s) => [mx(s.hook.x), my(s.hook.y)]),
    "#ecb277",
    2,
  );
  if (selected) {
    c.fillStyle = "#e6c48d88";
    for (const p of selected.pellets) {
      c.beginPath();
      c.arc(mx(p.x), my(p.y), 1.2, 0, Math.PI * 2);
      c.fill();
    }
    for (const f of selected.fish) {
      c.fillStyle = SPECIES[f.species].color;
      c.beginPath();
      c.ellipse(mx(f.x), my(f.y), 4, 2, -0.3, 0, 6.29);
      c.fill();
    }
    c.fillStyle = "#ffd095";
    c.beginPath();
    c.arc(mx(selected.hook.x), my(selected.hook.y), 5, 0, 6.29);
    c.fill();
    label(c, `钩饵深度 ${selected.hook.z.toFixed(1)} m`, 14, 23);
    label(c, `余饵 ${Math.round(selected.bait * 100)}%`, 14, 42, "#b9c9bc", 10);
  }
  label(c, "岸线", w * 0.5 - 12, h - 6, "#8faeb1", 10);
  label(c, "俯视复盘 / 水下轨迹", 14, h - 13, "#8faeb1", 10);
}
