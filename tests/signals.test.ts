import { it, expect } from "vitest";
import { SIGNALS } from "../src/data/signals";
import { sampleSignal, currentEvent } from "../src/simulation/signals";
it("provides all requested six fish and nine interference cases", () => {
  expect(SIGNALS.filter((s) => s.kind === "fish")).toHaveLength(6);
  expect(SIGNALS.filter((s) => s.kind === "environment")).toHaveLength(9);
  expect(new Set(SIGNALS.map((s) => s.id)).size).toBe(15);
});
it("float does not react before signal propagation, and every clip actually moves", () => {
  for (const s of SIGNALS) {
    expect(sampleSignal(s, 2).dip).toBeCloseTo(0);
    expect(sampleSignal(s, 2).side).toBeCloseTo(0);
    const samples = Array.from({ length: 40 }, (_, i) =>
      sampleSignal(s, 3.4 + i * 0.1),
    );
    expect(samples.some((x) => Math.abs(x.dip) + Math.abs(x.side) > 0.1)).toBe(
      true,
    );
  }
});
it("replay samples are deterministic and finite, including scrubbing backwards", () => {
  for (const s of SIGNALS) {
    const first = sampleSignal(s, 5);
    sampleSignal(s, 8);
    expect(sampleSignal(s, 5)).toEqual(first);
    for (let t = 0; t <= 8; t += 0.1) {
      const v = sampleSignal(s, t);
      expect(Number.isFinite(v.dip + v.side + v.fishDepth + v.fishX)).toBe(
        true,
      );
    }
  }
});
it("truth event is chosen by replay time rather than latest event", () => {
  expect(currentEvent(SIGNALS[0], 1)).toBe("鱼靠近钩饵");
  expect(currentEvent(SIGNALS[0], 2.2)).toBe("鱼吸入钩饵");
  expect(currentEvent(SIGNALS[0], 3.5)).toBe("扰动传到阿波");
});
