import { describe, expect, it } from "vitest";
import {
  DEFAULT_TACKLE,
  environment,
  ground,
  HOOKS,
  SITES,
  type Tackle,
} from "../src/field/data";
import {
  cast,
  chum,
  createSession,
  DT,
  retrieve,
  strike,
  tick,
  reserve,
  type World,
} from "../src/field/engine";
const make = (t: Partial<Tackle> = {}, seed = 987654321) =>
  createSession(environment("harbor", "dawn", "ripple", "flood", seed), {
    ...DEFAULT_TACKLE,
    ...t,
  });
function advance(w: World, seconds: number) {
  for (let i = 0; i < seconds / DT && w.phase !== "ended"; i++) w = tick(w);
  return w;
}
function biteFixture(t: Partial<Tackle> = {}, seed = 987654321) {
  const w = cast(
    make(t, seed),
    { x: 0, y: 22, z: 0 },
    { ...DEFAULT_TACKLE, ...t },
  );
  w.fish = [
    { ...w.fish[0], x: 0, y: 22, z: 3, mouth: 9, state: "run", clock: 1 },
  ];
  w.heldBy = w.fish[0].id;
  w.hook = { x: 0, y: 22, z: 3 };
  w.lineLength = 22;
  return w;
}
describe("field simulation", () => {
  it("cannot peck bait that is already inside another fish's mouth", () => {
    let w = biteFixture();
    w.bait = 0.8;
    w.fish.push({ ...w.fish[0], id: 99, state: "nibble", clock: 1 });
    w = tick(w);
    expect(w.bait).toBe(0.8);
    expect(w.fish[1].state).toBe("patrol");
  });
  it("locks a copied environment for the entire session and subsequent casts", () => {
    const w = make();
    expect(Object.isFrozen(w.env)).toBe(true);
    expect(() => Object.assign(w.env, { wind: 9 })).toThrow();
    const played = advance(cast(w, { x: 2, y: 25, z: 0 }, DEFAULT_TACKLE), 3);
    expect(played.env).toBe(w.env);
    expect(retrieve(played).env).toBe(w.env);
  });
  it("seeds a structured population below the surface and above terrain at every site", () => {
    for (const site of SITES) {
      const w = createSession(
        environment(site.id, "day", "calm", "ebb", 23890),
        DEFAULT_TACKLE,
      );
      expect(w.fish.length).toBe(26);
      for (const f of w.fish) {
        expect(f.z).toBeGreaterThan(0);
        expect(f.z).toBeLessThan(ground(w.env, f.x, f.y));
        if (f.species === "bream")
          expect(ground(w.env, f.x, f.y) - f.z).toBeLessThanOrEqual(1.41);
      }
    }
  });
  it("same input and seed produce the same fish, rig and recorded history", () => {
    const run = () =>
      advance(
        chum(cast(make(), { x: 0, y: 25, z: 0 }, DEFAULT_TACKLE), {
          x: 0,
          y: 25,
          z: 0,
        }),
        20,
      );
    expect(run()).toEqual(run());
  });
  it("recasting does not respawn or reset existing fish", () => {
    const first = advance(
        cast(make(), { x: 0, y: 25, z: 0 }, DEFAULT_TACKLE),
        10,
      ),
      end = retrieve(first),
      next = cast(end, { x: 4, y: 30, z: 0 }, DEFAULT_TACKLE);
    expect(next.fish).toEqual(end.fish);
    expect(next.time).toBe(end.time);
    expect(next.castCount).toBe(2);
  });
  it("cannot change the tackle by casting again mid-drift", () => {
    const w = cast(make(), { x: 0, y: 25, z: 0 }, DEFAULT_TACKLE);
    expect(cast(w, { x: 3, y: 27, z: 0 }, { ...DEFAULT_TACKLE, hook: 4 })).toBe(
      w,
    );
  });
  it("hook size alters both physical mass and bearing strength", () => {
    const small = make({ hook: 1 }),
      large = make({ hook: 4 });
    expect(reserve(large)).toBeLessThan(reserve(small));
    expect(HOOKS[0].hold).toBeLessThan(HOOKS[3].hold);
  });
  it("does not fabricate a timed bite when fish cannot sense the bait", () => {
    let w = cast(make(), { x: 0, y: 15, z: 0 }, DEFAULT_TACKLE);
    w.fish = w.fish.map((f) => ({
      ...f,
      x: 22,
      y: 52,
      home: { x: 22, y: 52, z: 3 },
      target: { x: 22, y: 52, z: 3 },
    }));
    w = advance(w, 35);
    expect(w.heldBy).toBeNull();
    expect(w.events.some((e) => e.text.includes("吸入"))).toBe(false);
  });
  it("oversize hooks get nibbled rather than swallowed by a small mouth", () => {
    let w = cast(
      make({ hook: 4 }),
      { x: 0, y: 24, z: 0 },
      { ...DEFAULT_TACKLE, hook: 4 },
    );
    w.hook = { x: 0, y: 24, z: 3 };
    w.fish = [
      { ...w.fish[0], x: 0, y: 24, z: 3, state: "inspect", clock: 5, mouth: 5 },
    ];
    w = tick(w);
    expect(w.fish[0].state).toBe("nibble");
    expect(w.heldBy).toBeNull();
    w = advance(w, 1);
    expect(w.bait).toBeLessThan(1);
  });
  it("a hooked fish requires line transmission; large slack reduces hooksets", () => {
    let tight = 0,
      loose = 0;
    for (let i = 1; i <= 150; i++) {
      const a = biteFixture({}, i * 71839),
        b = biteFixture({}, i * 71839);
      b.lineLength += 5;
      if (strike(a).phase === "fight") tight++;
      if (strike(b).phase === "fight") loose++;
    }
    expect(tight).toBeGreaterThan(65);
    expect(loose).toBeLessThan(tight * 0.35);
  });
  it("no fish in the mouth means an empty strike, even with visible float immersion", () => {
    const w = cast(make(), { x: 0, y: 25, z: 0 }, DEFAULT_TACKLE);
    w.floatDip = 0.8;
    expect(strike(w).result?.kind).toBe("miss");
  });
  it("particles drift, sink and persist across casts instead of drawing a fake plume", () => {
    let w = chum(make(), { x: 0, y: 25, z: 0 });
    const initial = w.pellets.map((p) => ({ ...p }));
    w = advance(w, 3);
    expect(w.pellets[0].z).toBeGreaterThan(0);
    expect(w.pellets[0].x).toBeGreaterThan(initial[0].x);
    expect(initial[0].z).toBe(0);
    const next = cast(w, { x: 2, y: 25, z: 0 }, DEFAULT_TACKLE);
    expect(next.pellets).toEqual(w.pellets);
  });
  it("snapshots are independent and never mutate on later steps", () => {
    let w = advance(cast(make(), { x: 0, y: 25, z: 0 }, DEFAULT_TACKLE), 3);
    const frame = w.trace[0],
      copy = JSON.parse(JSON.stringify(frame));
    w = advance(w, 2);
    expect(frame).toEqual(copy);
    expect(w.trace.length).toBeGreaterThan(12);
  });
  it("reel pressure can land a tired fish and remove it from the active population", () => {
    let w = biteFixture();
    w.phase = "fight";
    w.fish[0].state = "hooked";
    w.fish[0].y = 9;
    w.fish[0].weight = 0.3;
    w.fish[0].energy = 0.15;
    w.reel = "reel";
    w = advance(w, 15);
    expect(w.result?.kind).toBe("landed");
    expect(w.catches).toHaveLength(1);
    expect(w.fish[0].state).toBe("landed");
  });
  it("tight drag and a strong fish can break a thin leader", () => {
    let w = biteFixture({ hook: 4, line: 0.18, drag: 24 });
    w.phase = "fight";
    w.fish[0].state = "hooked";
    w.fish[0].weight = 4;
    w.reel = "reel";
    w = advance(w, 8);
    expect(w.result?.kind).toBe("broken");
  });
  it("a small hook is the weakest link even with a thick leader", () => {
    let w = biteFixture({ hook: 1, line: 0.28, drag: 20 });
    w.phase = "fight";
    w.fish[0].state = "hooked";
    w.fish[0].weight = 3;
    w.reel = "reel";
    w = advance(w, 8);
    expect(w.result?.kind).toBe("broken");
    expect(w.result?.detail).toContain("小钩");
  });
  it("seabed contact and snagging depend on actual position, depth and material", () => {
    let w = createSession(environment("reef", "day", "calm", "flood", 424123), {
      ...DEFAULT_TACKLE,
      depth: 10,
      hook: 4,
    });
    w = cast(w, { x: 7, y: 31, z: 0 }, w.tackle);
    w.fish = [];
    w = advance(w, 65);
    expect(w.events.some((e) => e.text.includes("接触礁石"))).toBe(true);
    expect(w.events.some((e) => e.text.includes("卡入礁缝"))).toBe(true);
    expect(w.hook.z).toBeLessThanOrEqual(
      ground(w.env, w.hook.x, w.hook.y) + 0.01,
    );
  });
  it("fish movement never penetrates terrain", () => {
    let w = createSession(
      environment("reef", "dusk", "rough", "ebb", 5551),
      DEFAULT_TACKLE,
    );
    for (let i = 0; i < 900; i++) {
      w = tick(w);
      for (const f of w.fish) expect(f.z).toBeLessThan(ground(w.env, f.x, f.y));
    }
  });
});
