import { DEFAULT_TACKLE, environment, SITES } from "../src/field/data";
import {
  cast,
  chum,
  createSession,
  tick,
  DT,
  strike,
  type World,
} from "../src/field/engine";
// Reproducible model audit, not an ecological or player-success estimate.
// This oracle sees underwater state to verify the complete catch path exists.
for (const site of SITES) {
  const results = [];
  for (let seed = 1; seed <= 8; seed++) {
    const tackle = { ...DEFAULT_TACKLE, depth: site.id === "reef" ? 6 : 4.5 };
    let w: World = createSession(
      environment(site.id, "dawn", "ripple", "flood", seed * 784973),
      tackle,
    );
    const aim = {
      x: site.id === "reef" ? 8 : 0,
      y: site.id === "reef" ? 31 : 26,
      z: 0,
    };
    w = cast(chum(w, aim), aim, tackle);
    let first: number | null = null,
      hooked = false;
    for (let i = 0; i < 180 / DT + 2 && w.phase !== "ended"; i++) {
      if (i > 0 && i % 450 === 0) w = chum(w, aim);
      const held = w.fish.find((f) => f.id === w.heldBy);
      if (held?.state === "run" && held.clock > 0.7 && w.phase === "fishing") {
        first ??= w.time;
        w = strike(w);
        hooked = w.phase === "fight";
      }
      if (w.phase === "fight") w = { ...w, reel: "reel", drag: 5.5 };
      w = tick(w);
    }
    results.push({
      seed,
      firstTake: first?.toFixed(1) ?? null,
      hooked,
      result: w.result?.kind,
      bites: w.events.filter((e) => e.text.includes("吸入钩饵")).length,
      inspections: w.events.filter((e) => e.text.includes("停下来试探")).length,
      snag: w.events.some((e) => e.text.includes("卡入")),
      bait: Number(w.bait.toFixed(2)),
    });
  }
  console.log(JSON.stringify({ site: site.id, results }));
}
