import { describe, it, expect } from "vitest";
import { balance } from "../src/physics/model";
import { DEFAULTS, constrain } from "../src/physics/simulationConfig";
import { FixedClock, initialFrame, step } from "../src/simulation/engine";
describe("teaching physics relationships", () => {
  it("adding shot reduces reserve and increases sink speed", () => {
    const a = balance(DEFAULTS),
      b = balance({ ...DEFAULTS, shot: 2 });
    expect(b.reserve).toBeLessThan(a.reserve);
    expect(b.exposure).toBeLessThan(a.exposure);
    expect(b.sinkSpeed).toBeGreaterThan(a.sinkSpeed);
  });
  it("no differential current or wind places bait directly below float", () => {
    let s = initialFrame();
    const p = {
      ...DEFAULTS,
      wind: 0,
      current: 0.2,
      surfaceCurrent: 0.2,
      bottomCurrent: 0.2,
    };
    for (let i = 0; i < 1800; i++) s = step(s, p);
    expect(s.hook.x).toBeCloseTo(s.float.x);
    expect(s.hook.depth).toBeCloseTo(p.fishingDepth);
  });
  it("cross wind changes lateral displacement, not only a label", () => {
    const a = balance({ ...DEFAULTS, wind: 5, windDirection: 90 }),
      b = balance({ ...DEFAULTS, wind: 5, windDirection: 0 });
    expect(a.drift.y).not.toEqual(b.drift.y);
    expect(a.tilt).toBeGreaterThan(0);
  });
  it("heavy overload sinks float and never crosses sea floor", () => {
    let s = initialFrame();
    const p = { ...DEFAULTS, shot: 4, waterDepth: 2 };
    for (let i = 0; i < 1800; i++) s = step(s, p);
    expect(s.float.depth).toBeGreaterThan(0);
    expect(s.hook.depth).toBeLessThanOrEqual(2);
    expect(s.bottom).toBe(true);
  });
  it("30 and 120 fps produce identical fixed steps", () => {
    const simulate = (fps: number) => {
      const clock = new FixedClock();
      let s = initialFrame();
      for (let i = 0; i < fps * 10; i++)
        clock.advance(1 / fps, () => (s = step(s, DEFAULTS)));
      return s;
    };
    expect(simulate(30)).toEqual(simulate(120));
  });
  it("keeps malformed controls and leader length in bounds", () => {
    const p = constrain({
      ...DEFAULTS,
      waterDepth: NaN,
      leader: 4,
      fishingDepth: 1,
    });
    expect(p.waterDepth).toBe(DEFAULTS.waterDepth);
    expect(p.leader).toBe(1);
  });
});
it("changing tidal speed changes both surface drift and underwater angle in layered flow", () => {
  const a = balance(DEFAULTS),
    b = balance({ ...DEFAULTS, current: 0.6 });
  expect(b.drift.x).not.toBe(a.drift.x);
  expect(b.tilt).not.toBe(a.tilt);
});
