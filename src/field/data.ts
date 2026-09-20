export type SiteId = "harbor" | "reef" | "inlet";
export type TimeId = "dawn" | "day" | "dusk";
export type SeaId = "calm" | "ripple" | "rough";
export type Species = "bream" | "bass" | "small";
export type Vec = { x: number; y: number; z: number };
export type Obstacle = {
  x: number;
  y: number;
  radius: number;
  height: number;
  kind: "rock" | "weed";
};
export interface Site {
  id: SiteId;
  name: string;
  en: string;
  label: string;
  description: string;
  depth: number;
  current: number;
  clarity: number;
  tint: string;
  features: string[];
  obstacles: Obstacle[];
}
export const SITES: Site[] = [
  {
    id: "harbor",
    name: "内湾防波堤",
    en: "THE BREAKWATER",
    label: "遮蔽水域 / 缓流",
    description:
      "堤脚碎石向砂底过渡。鱼群常沿结构边缘活动，流速较缓，适合先摸清钓组。",
    depth: 6.3,
    current: 0.12,
    clarity: 3.8,
    tint: "#548e8d",
    features: ["堤脚碎石", "砂石交界", "局部水草"],
    obstacles: [
      { x: -8, y: 21, radius: 5, height: 1.2, kind: "rock" },
      { x: 7, y: 29, radius: 4, height: 1.5, kind: "rock" },
      { x: -3, y: 15, radius: 4, height: 0.5, kind: "weed" },
      { x: 14, y: 37, radius: 6, height: 0.8, kind: "weed" },
    ],
  },
  {
    id: "reef",
    name: "礁岸外缘",
    en: "THE ROCKY POINT",
    label: "起伏礁底 / 中流",
    description:
      "暗礁、沟槽和外缘深水相接。结构提供藏身处，也会咬住过深的钩饵与受力的子线。",
    depth: 10.4,
    current: 0.24,
    clarity: 5.5,
    tint: "#386b7e",
    features: ["暗礁密集", "落差沟槽", "大鱼巡游"],
    obstacles: [
      { x: -10, y: 24, radius: 6, height: 3.5, kind: "rock" },
      { x: 7, y: 31, radius: 7, height: 4, kind: "rock" },
      { x: 14, y: 43, radius: 5, height: 2.5, kind: "rock" },
      { x: -4, y: 39, radius: 4, height: 2.2, kind: "rock" },
      { x: 0, y: 17, radius: 4, height: 1, kind: "weed" },
    ],
  },
  {
    id: "inlet",
    name: "河口潮道",
    en: "THE TIDAL PASS",
    label: "浑水潮口 / 急缓流交界",
    description:
      "主潮道和岸侧缓流并行。诱饵带会被拉长，鱼群沿流边搜索，远处的饵未必被发现。",
    depth: 8.2,
    current: 0.38,
    clarity: 2.1,
    tint: "#647c70",
    features: ["流速剪切", "砂泥底", "流边觅食"],
    obstacles: [
      { x: -13, y: 22, radius: 5, height: 1.6, kind: "rock" },
      { x: 12, y: 35, radius: 6, height: 0.6, kind: "weed" },
      { x: -5, y: 43, radius: 4, height: 1.1, kind: "rock" },
    ],
  },
];
export interface Environment {
  readonly site: SiteId;
  readonly time: TimeId;
  readonly sea: SeaId;
  readonly tide: "flood" | "ebb";
  readonly wind: number;
  readonly wave: number;
  readonly flow: number;
  readonly clarity: number;
  readonly seed: number;
}
export function environment(
  site: SiteId,
  time: TimeId,
  sea: SeaId,
  tide: "flood" | "ebb",
  seed: number,
): Environment {
  const s = SITES.find((v) => v.id === site)!;
  return Object.freeze({
    site,
    time,
    sea,
    tide,
    seed,
    wind: sea === "calm" ? 1.2 : sea === "ripple" ? 3.4 : 6.2,
    wave: sea === "calm" ? 0.08 : sea === "ripple" ? 0.26 : 0.52,
    flow: s.current * (tide === "flood" ? 1 : -0.82),
    clarity: s.clarity * (sea === "rough" ? 0.72 : 1),
  });
}
export const HOOKS = [
  { id: 1, name: "1 号", label: "小钩", gape: 4.5, mass: 0.035, hold: 9 },
  { id: 2, name: "2 号", label: "中小钩", gape: 6.5, mass: 0.07, hold: 15 },
  { id: 3, name: "3 号", label: "中大钩", gape: 8.5, mass: 0.12, hold: 24 },
  { id: 4, name: "4 号", label: "大钩", gape: 11, mass: 0.2, hold: 34 },
];
export const BAITS = [
  { id: "krill", name: "南极虾", size: 5, mass: 0.1, attraction: 1 },
  { id: "shrimp", name: "虾肉", size: 9, mass: 0.24, attraction: 1.2 },
  { id: "worm", name: "虫饵", size: 4, mass: 0.08, attraction: 0.85 },
] as const;
export interface Tackle {
  hook: number;
  bait: (typeof BAITS)[number]["id"];
  shot: number;
  depth: number;
  float: number;
  line: number;
  drag: number;
}
export const DEFAULT_TACKLE: Tackle = {
  hook: 2,
  bait: "krill",
  shot: 1.1,
  depth: 4.5,
  float: 1.8,
  line: 0.22,
  drag: 6,
};
export const SPECIES: Record<
  Species,
  { name: string; color: string; speed: number; mouth: number; bold: number }
> = {
  bream: {
    name: "礁栖鲷类",
    color: "#d9c9a0",
    speed: 0.55,
    mouth: 0.23,
    bold: 0.62,
  },
  bass: {
    name: "巡游鲈类",
    color: "#a8ccce",
    speed: 1.05,
    mouth: 0.4,
    bold: 0.8,
  },
  small: {
    name: "小型啄食鱼",
    color: "#d39d71",
    speed: 0.8,
    mouth: 0.2,
    bold: 0.9,
  },
};
export const clamp = (n: number, a: number, b: number) =>
  Math.max(a, Math.min(b, n));
export const dist = (a: Vec, b: Vec) =>
  Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
export const siteOf = (e: Environment) => SITES.find((s) => s.id === e.site)!;
export function ground(e: Environment, x: number, y: number) {
  const s = siteOf(e);
  let d =
    1.7 +
    s.depth * (1 - Math.exp(-Math.max(0, y) / 25)) +
    0.35 * Math.sin(x * 0.27 + y * 0.18);
  for (const o of s.obstacles)
    if (o.kind === "rock")
      d -=
        o.height *
        Math.exp(-((x - o.x) ** 2 + (y - o.y) ** 2) / (o.radius ** 2 * 0.65));
  return Math.max(1.4, d);
}
export function substrate(
  e: Environment,
  x: number,
  y: number,
): "rock" | "weed" | "sand" {
  for (const o of siteOf(e).obstacles)
    if (Math.hypot(x - o.x, y - o.y) < o.radius * 0.9) return o.kind;
  return "sand";
}
export function current(e: Environment, p: Vec) {
  const shear =
    e.site === "inlet" ? 0.42 + 0.95 * Math.exp(-((p.x - 3) ** 2) / 75) : 1;
  const depth = clamp(1 - (p.z / (ground(e, p.x, p.y) + 1)) * 0.62, 0.28, 1);
  return {
    x: e.flow * shear * depth,
    y: e.flow * 0.25 + Math.sin(p.y * 0.15) * Math.abs(e.flow) * 0.2,
  };
}
