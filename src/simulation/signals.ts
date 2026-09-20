import { clamp } from "../physics/model";
import type { SignalCase } from "../data/signals";
import type { Disturbance } from "./engine";
import { DEFAULTS, CONFIG } from "../physics/simulationConfig";
import type { Frame } from "./engine";
export const SIGNAL_PARAMS = {
  ...DEFAULTS,
  wind: 1,
  wave: 0.22,
  fishingDepth: 3.5,
};
export function sampleSignal(
  s: SignalCase,
  time: number,
  amplitude = 1,
): Disturbance {
  const t = clamp(time, 0, CONFIG.signalDuration),
    u = Math.max(0, t - 3.4),
    r = clamp(u / 2, 0, 1);
  let dip = 0,
    side = 0;
  switch (s.id) {
    case "fast":
      dip = clamp(u * 1.2, 0, 2.1);
      side = r * 0.35;
      break;
    case "slow":
      dip = u * 0.32;
      break;
    case "side":
      side = u * 0.75;
      dip = r * 0.2;
      break;
    case "pause":
      dip = Math.max(0, u - 1.7) * 1.2;
      side = Math.max(0, u - 1.7) * 0.45;
      break;
    case "peck":
      dip =
        u < 1.7
          ? Math.max(0, Math.sin(u * 9)) * 0.3
          : Math.min(2, (u - 1.7) * 1.25);
      break;
    case "rise":
      dip = -r * 0.8;
      side = r * 0.1;
      break;
    case "wave":
      dip = Math.sin((u * 2 * Math.PI) / CONFIG.wavePeriod) * 0.65 * r;
      break;
    case "wind":
      side = u * 0.52;
      dip = r * 0.48;
      break;
    case "surge":
      side = r * 1.5;
      dip = Math.sin(Math.min(u, 2.8)) * r * 0.9;
      break;
    case "eddy":
      side = Math.sin(u * 0.8) * 1.9;
      dip = r * 0.2;
      break;
    case "seam":
      dip = Math.min(u * 0.9, 1.45);
      side = r * 0.3;
      break;
    case "rock":
      dip = u < 0.5 ? Math.sin(u * 6) * 0.8 : r * 0.6;
      side = -r * 0.2;
      break;
    case "bottom":
      dip = u < 1.6 ? -Math.sin(u * 1.9) * 0.5 : (u - 1.6) * 0.28;
      break;
    case "line":
      dip = clamp(u * 1.4, 0, 1.8);
      side = -r * 0.4;
      break;
    case "nibble":
      dip = Math.max(0, Math.sin(u * 9)) * 0.32;
      break;
  }
  const biting = s.kind === "fish" && t >= (s.id === "peck" ? 5.1 : 2);
  const baitOffset = s.id === "rise" ? dip * 1.5 : dip * 0.25;
  return {
    dip: dip * amplitude,
    side: side * amplitude,
    fishX:
      s.kind === "fish"
        ? t < 2
          ? 3.5 * (1 - t / 2) - 0.5
          : -0.5
        : s.id === "nibble"
          ? -0.2 + Math.sin(t * 9) * 0.12
          : 3 + Math.sin(t * 0.5),
    fishDepth: 3.5 + baitOffset,
    fishState: biting
      ? t < 5.1
        ? "含饵 / 线组传递"
        : "含饵后游动"
      : s.kind === "fish"
        ? "接近"
        : "环境扰动",
    source: s.name,
    sourceId: s.id,
    baitOffset,
  };
}
export function signalFrame(time: number, s: SignalCase): Frame {
  const bottom = s.id === "rock" || s.id === "bottom";
  const depth =
    s.id === "bottom" ? SIGNAL_PARAMS.waterDepth : s.id === "rock" ? 5.5 : 3.5;
  return {
    time,
    float: { x: time * 0.2, y: 0, depth: 0 },
    hook: { x: time * 0.2 - 0.7, y: 0, depth },
    wave:
      (Math.sin((Math.max(0, time - 3.4) * 2 * Math.PI) / CONFIG.wavePeriod) *
        SIGNAL_PARAMS.wave) /
      2,
    tension: time > 2.7 ? 0.01 : 0,
    bottom,
    trail: [],
  };
}
export const currentEvent = (s: SignalCase, t: number) =>
  [...s.events].reverse().find((e) => e.time <= t)?.label ?? "观察原有漂流节奏";
