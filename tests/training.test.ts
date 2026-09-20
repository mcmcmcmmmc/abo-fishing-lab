import { it, expect } from "vitest";
import { SIGNALS } from "../src/data/signals";
import { chooseCase, evaluate } from "../src/training/evaluate";
import { parseProgress, EMPTY } from "../src/training/progress";
it("does not immediately repeat the previous case", () => {
  for (const previous of SIGNALS) {
    for (const r of [0, 0.5, 0.999])
      expect(chooseCase(previous.id, () => r).id).not.toBe(previous.id);
  }
});
it("scores identification separately from action", () => {
  const r = evaluate(SIGNALS[0], "fish", "wait");
  expect(r.identified).toBe(true);
  expect(r.actionCorrect).toBe(false);
  const up = SIGNALS.find((s) => s.id === "rise")!;
  expect(evaluate(up, "fish", "wait").actionCorrect).toBe(true);
});
it("accepts uncertainty without pretending it identified the cause", () => {
  expect(evaluate(SIGNALS[0], "uncertain", "wait")).toMatchObject({
    identified: null,
    actionCorrect: true,
  });
  expect(evaluate(SIGNALS[0], "uncertain", "strike").actionCorrect).toBe(false);
});
it("recovers corrupt or impossible saved data", () => {
  for (const raw of [
    null,
    "{oops",
    "{}",
    JSON.stringify({ ...EMPTY, attempts: -1 }),
    JSON.stringify({ ...EMPTY, identified: 20 }),
  ])
    expect(parseProgress(raw)).toEqual(EMPTY);
});
it("round-trips valid local learning progress", () => {
  const p = {
    ...EMPTY,
    explored: ["rig", "water"],
    attempts: 3,
    evaluated: 2,
    identified: 1,
    actions: 2,
  };
  expect(parseProgress(JSON.stringify(p))).toEqual(p);
});
