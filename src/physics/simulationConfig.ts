export const CONFIG = {
  timestep: 1 / 30,
  maxFrameDelta: 0.2,
  duration: 60,
  gravity: 9.81,
  surfaceTideBlend: 0.35,
  deepTideBlend: 0.75,
  waterDrag: 0.38,
  receiverDrag: 0.22,
  windCoupling: 0.025,
  baseSinkRate: 0.07,
  sinkWeightScale: 0.24,
  leaderDrag: 0.06,
  hookLoad: 0.04,
  hardwareLoad: 0.06,
  floatBodyMass: 0.5,
  wavePeriod: 3.2,
  maxTilt: 1.28,
  signalDuration: 8,
} as const;
export interface Parameters {
  waterDepth: number;
  current: number;
  currentDirection: number;
  surfaceCurrent: number;
  bottomCurrent: number;
  wind: number;
  windDirection: number;
  wave: number;
  buoyancy: number;
  shot: number;
  leader: number;
  bait: number;
  fishingDepth: number;
}
export const DEFAULTS: Parameters = {
  waterDepth: 7,
  current: 0.25,
  currentDirection: 15,
  surfaceCurrent: 0.3,
  bottomCurrent: 0.1,
  wind: 2,
  windDirection: 0,
  wave: 0.2,
  buoyancy: 1.8,
  shot: 1,
  leader: 2,
  bait: 0.12,
  fishingDepth: 4,
};
export const CONTROLS: {
  key: keyof Parameters;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  group: "环境" | "钓组";
}[] = [
  {
    key: "waterDepth",
    label: "水深",
    unit: "m",
    min: 2,
    max: 12,
    step: 0.5,
    group: "环境",
  },
  {
    key: "current",
    label: "潮流速度",
    unit: "m/s",
    min: 0,
    max: 0.8,
    step: 0.05,
    group: "环境",
  },
  {
    key: "currentDirection",
    label: "潮流方向",
    unit: "°",
    min: -180,
    max: 180,
    step: 15,
    group: "环境",
  },
  {
    key: "surfaceCurrent",
    label: "表层流",
    unit: "m/s",
    min: 0,
    max: 0.8,
    step: 0.05,
    group: "环境",
  },
  {
    key: "bottomCurrent",
    label: "底层流",
    unit: "m/s",
    min: 0,
    max: 0.8,
    step: 0.05,
    group: "环境",
  },
  {
    key: "wind",
    label: "风速",
    unit: "m/s",
    min: 0,
    max: 10,
    step: 0.5,
    group: "环境",
  },
  {
    key: "windDirection",
    label: "风向",
    unit: "°",
    min: -180,
    max: 180,
    step: 15,
    group: "环境",
  },
  {
    key: "wave",
    label: "浪高",
    unit: "m",
    min: 0,
    max: 1,
    step: 0.05,
    group: "环境",
  },
  {
    key: "buoyancy",
    label: "阿波承载量",
    unit: "g 等效",
    min: 0.5,
    max: 4,
    step: 0.1,
    group: "钓组",
  },
  {
    key: "shot",
    label: "咬铅重量",
    unit: "g 等效",
    min: 0,
    max: 4,
    step: 0.1,
    group: "钓组",
  },
  {
    key: "leader",
    label: "子线长度",
    unit: "m",
    min: 0.5,
    max: 4,
    step: 0.25,
    group: "钓组",
  },
  {
    key: "bait",
    label: "钩饵重量",
    unit: "g 等效",
    min: 0.02,
    max: 0.5,
    step: 0.02,
    group: "钓组",
  },
  {
    key: "fishingDepth",
    label: "设定钓棚",
    unit: "m 沿线",
    min: 1,
    max: 10,
    step: 0.25,
    group: "钓组",
  },
];
export function constrain(p: Parameters): Parameters {
  const result = { ...p };
  for (const c of CONTROLS)
    result[c.key] = Math.min(
      c.max,
      Math.max(c.min, Number.isFinite(p[c.key]) ? p[c.key] : DEFAULTS[c.key]),
    );
  result.leader = Math.min(result.leader, result.fishingDepth);
  return result;
}
