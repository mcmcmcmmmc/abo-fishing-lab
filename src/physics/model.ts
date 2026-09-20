import { CONFIG, type Parameters } from "./simulationConfig";
export const clamp = (n: number, a: number, b: number) =>
  Math.max(a, Math.min(b, n));
export const vector = (speed: number, degrees: number) => ({
  x: speed * Math.cos((degrees * Math.PI) / 180),
  y: speed * Math.sin((degrees * Math.PI) / 180),
});
export function balance(p: Parameters) {
  const load = p.shot + p.bait + CONFIG.hookLoad + CONFIG.hardwareLoad;
  const reserve = p.buoyancy - load;
  // Constant equivalent cross section: volume fraction, not a real float's visible height calibration.
  const exposure = clamp(reserve / (p.buoyancy + CONFIG.floatBodyMass), 0, 1);
  const sinkSpeed =
    (CONFIG.baseSinkRate + CONFIG.sinkWeightScale * Math.sqrt(load)) /
    (1 + p.leader * CONFIG.leaderDrag);
  const surface = vector(
    p.current * CONFIG.surfaceTideBlend +
      p.surfaceCurrent * (1 - CONFIG.surfaceTideBlend),
    p.currentDirection,
  );
  const deep = vector(
    p.current * CONFIG.deepTideBlend +
      p.bottomCurrent * (1 - CONFIG.deepTideBlend),
    p.currentDirection,
  );
  const wind = vector(p.wind * CONFIG.windCoupling, p.windDirection);
  const drift = { x: surface.x + wind.x, y: surface.y + wind.y };
  const relative = { x: deep.x - drift.x, y: deep.y - drift.y };
  const drag = {
    x: relative.x * (CONFIG.waterDrag + CONFIG.receiverDrag),
    y: relative.y * (CONFIG.waterDrag + CONFIG.receiverDrag),
  };
  const tilt = Math.min(
    CONFIG.maxTilt,
    Math.atan2(Math.hypot(drag.x, drag.y) * 4, load),
  );
  const targetDepth = Math.min(p.waterDepth, p.fishingDepth * Math.cos(tilt));
  return {
    load,
    reserve,
    exposure,
    sinkSpeed,
    drift,
    drag,
    tilt,
    targetDepth,
    overloaded: reserve < 0,
    gravity: (load * CONFIG.gravity) / 1000,
    capacity: (p.buoyancy * CONFIG.gravity) / 1000,
    // A damped settling time proxy, explicitly labeled as a teaching approximation in UI.
    settlingTime:
      (CONFIG.floatBodyMass + load) / (CONFIG.waterDrag + CONFIG.receiverDrag),
    signalDelay: 0.15 + p.leader * 0.13 + Math.sin(tilt) * 0.8,
  };
}
