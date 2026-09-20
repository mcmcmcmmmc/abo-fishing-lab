import { describe, expect, it } from "vitest";
import {
  createWorld,
  DEFAULT_SETUP,
  tick,
  rigModel,
  feed,
  snapshot,
  decide,
  bottomAt,
  type World,
} from "../src/v2/model";

function until(w: World, predicate: (w: World) => boolean) {
  for (let i = 0; i < 1000 && !predicate(w) && !w.outcome; i++) w = tick(w);
  return w;
}
describe("continuous teaching ocean", () => {
  it("reproduces a complete cast from the same settings, seed and feed", () => {
    const run = () => until(feed(createWorld()), (w) => w.time >= 20);
    expect(run()).toEqual(run());
  });
  it("heavier shot reaches deeper water sooner but consumes float capacity", () => {
    const light = { ...DEFAULT_SETUP, shot: 0.2 };
    const heavy = { ...DEFAULT_SETUP, shot: 1.4 };
    const a = until(createWorld(light), (w) => w.time >= 5);
    const b = until(createWorld(heavy), (w) => w.time >= 5);
    expect(b.hook.depth).toBeGreaterThan(a.hook.depth);
    expect(rigModel(heavy).reserve).toBeLessThan(rigModel(light).reserve);
  });
  it("flow tilts the rig and reduces vertical reach while preserving line length geometry", () => {
    const still = rigModel({ ...DEFAULT_SETUP, flow: 0, wind: 0 });
    const moving = rigModel({ ...DEFAULT_SETUP, flow: 0.9, wind: 0 });
    expect(still.targetDepth).toBe(DEFAULT_SETUP.depth);
    expect(moving.targetDepth).toBeLessThan(still.targetDepth);
    expect(Math.hypot(moving.targetDepth, moving.offset)).toBeCloseTo(
      DEFAULT_SETUP.depth,
    );
  });
  it("fish contact precedes visible sustained traction and early strikes fail", () => {
    let w = until(
      createWorld(DEFAULT_SETUP, 18, "challenge", 0),
      (w) => w.fish.phase === "bite",
    );
    expect(w.fish.phase).toBe("bite");
    expect(w.signalStarted).toBeNull();
    expect(decide(w, "strike").outcome?.good).toBe(false);
    w = until(w, (w) => w.signalStarted !== null);
    expect(w.signalStarted).not.toBeNull();
    expect(w.signalStarted!).toBeGreaterThan(w.biteStarted!);
    expect(decide(w, "strike").outcome?.good).toBe(true);
  });
  it.each([1, 2, 3])(
    "environment case %i does not secretly contain a fish bite",
    (seed) => {
      const w = until(
        createWorld(DEFAULT_SETUP, 18, "challenge", seed),
        (w) => w.time >= 20,
      );
      expect(w.biteStarted).toBeNull();
      expect(w.fish.phase).toBe("cruise");
      expect(decide(w, "strike").outcome?.good).toBe(false);
      if (seed === 3) expect(w.contactStarted).not.toBeNull();
      else expect(w.eventStarted).not.toBeNull();
    },
  );
  it("never identifies a scheduled wind or wave before it has happened", () => {
    for (const seed of [1, 2]) {
      const w = until(
        createWorld(DEFAULT_SETUP, 18, "challenge", seed),
        (w) => w.time >= 3,
      );
      expect(decide(w, "wait").outcome?.actual).toBe("尚未出现可靠吃口");
    }
  });
  it("overweight floats submerge without a fish, and snapshots remain unchanged", () => {
    let w = createWorld({ ...DEFAULT_SETUP, shot: 2.4 });
    const record = snapshot(w);
    w = until(feed(w), (w) => w.time >= 16);
    expect(w.float.depth).toBeGreaterThan(1);
    expect(w.biteStarted).toBeNull();
    expect(decide(w, "strike").outcome?.actual).toBe("配重过重");
    expect(record.float.depth).toBe(0);
    expect(record.particles).toHaveLength(0);
    expect(record.time).toBe(0);
  });
  it("hooks never pass through the seabed in any training case", () => {
    for (let seed = 0; seed < 4; seed++) {
      let w = createWorld(DEFAULT_SETUP, 18, "challenge", seed);
      for (let i = 0; i < 960; i++) {
        w = tick(w);
        expect(w.hook.depth).toBeLessThanOrEqual(bottomAt(w.hook.x));
      }
    }
  });
});
