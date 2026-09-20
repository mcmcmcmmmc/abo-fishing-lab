import { balance, clamp } from "../physics/model";
import { CONFIG, type Parameters } from "../physics/simulationConfig";
export interface Point {
  x: number;
  y: number;
  depth: number;
}
export interface Frame {
  time: number;
  float: Point;
  hook: Point;
  wave: number;
  tension: number;
  bottom: boolean;
  trail: Point[];
}
export const initialFrame = (): Frame => ({
  time: 0,
  float: { x: 0, y: 0, depth: 0 },
  hook: { x: 0, y: 0, depth: 0 },
  wave: 0,
  tension: 0,
  bottom: false,
  trail: [],
});
export function step(state: Frame, p: Parameters, dt = CONFIG.timestep): Frame {
  const b = balance(p),
    time = Math.min(CONFIG.duration, state.time + dt);
  const floatDepth = b.overloaded
    ? Math.min(
        p.waterDepth,
        state.float.depth + Math.abs(b.reserve) * 0.09 * dt,
      )
    : Math.max(0, state.float.depth - 0.3 * dt);
  const float = {
    x: state.float.x + b.drift.x * dt,
    y: state.float.y + b.drift.y * dt,
    depth: floatDepth,
  };
  const depth = clamp(
    state.hook.depth +
      Math.sign(b.targetDepth + floatDepth - state.hook.depth) *
        Math.min(
          Math.abs(b.targetDepth + floatDepth - state.hook.depth),
          b.sinkSpeed * dt,
        ),
    0,
    p.waterDepth,
  );
  const horizontal = Math.max(0, depth - floatDepth) * Math.tan(b.tilt);
  const norm = Math.hypot(b.drag.x, b.drag.y) || 1;
  const hook = {
    x: float.x + (horizontal * b.drag.x) / norm,
    y: float.y + (horizontal * b.drag.y) / norm,
    depth,
  };
  const bottom = depth >= p.waterDepth - 0.01;
  return {
    time,
    float,
    hook,
    bottom,
    wave: (Math.sin((time * 2 * Math.PI) / CONFIG.wavePeriod) * p.wave) / 2,
    tension:
      b.gravity *
      Math.min(1, Math.max(0, depth - floatDepth) / (b.targetDepth || 1)),
    trail:
      Math.floor(time * 5) > Math.floor(state.time * 5)
        ? [...state.trail.slice(-119), float]
        : state.trail,
  };
}
export class FixedClock {
  private accumulator = 0;
  advance(elapsed: number, tick: () => void) {
    this.accumulator += Math.min(CONFIG.maxFrameDelta, Math.max(0, elapsed));
    while (this.accumulator + 1e-10 >= CONFIG.timestep) {
      tick();
      this.accumulator -= CONFIG.timestep;
    }
  }
  reset() {
    this.accumulator = 0;
  }
}

export interface Disturbance {
  dip: number;
  side: number;
  fishX: number;
  fishDepth: number;
  fishState: string;
  source: string;
  sourceId: string;
  baitOffset: number;
}
