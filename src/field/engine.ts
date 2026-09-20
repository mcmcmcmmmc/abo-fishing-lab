import {
  BAITS,
  HOOKS,
  SPECIES,
  clamp,
  current,
  dist,
  ground,
  siteOf,
  substrate,
  type Environment,
  type Tackle,
  type Vec,
  type Species,
} from "./data";
export const DT = 1 / 30;
export type FishState =
  | "patrol"
  | "forage"
  | "inspect"
  | "nibble"
  | "take"
  | "run"
  | "spooked"
  | "hooked"
  | "landed";
export interface Fish extends Vec {
  id: number;
  species: Species;
  length: number;
  weight: number;
  home: Vec;
  target: Vec;
  state: FishState;
  clock: number;
  hunger: number;
  caution: number;
  energy: number;
  heading: number;
  mouth: number;
  attempt: number;
}
export interface Pellet extends Vec {
  age: number;
  life: number;
}
export interface Trace {
  t: number;
  hook: Vec;
  float: Vec;
  fish: (Vec & { species: Species })[];
  pellets: Vec[];
  bait: number;
  tension: number;
  dip: number;
  events: number;
}
export interface Log {
  t: number;
  text: string;
  kind: "fish" | "line" | "environment" | "action";
}
export interface Result {
  kind: "landed" | "miss" | "lost" | "broken" | "retrieve" | "timeout";
  title: string;
  detail: string;
  fish?: { species: Species; length: number; weight: number };
  duration: number;
}
export interface World {
  env: Environment;
  rng: number;
  time: number;
  castTime: number;
  castCount: number;
  phase: "ready" | "fishing" | "fight" | "ended";
  tackle: Tackle;
  fish: Fish[];
  pellets: Pellet[];
  float: Vec;
  hook: Vec;
  velocity: Vec;
  aim: Vec;
  bait: number;
  lineLength: number;
  tension: number;
  floatDip: number;
  dipVelocity: number;
  floatTilt: number;
  wear: number;
  snag: "rock" | "weed" | null;
  snagTime: number;
  slackTime: number;
  heldBy: number | null;
  reel: "neutral" | "reel" | "feed";
  drag: number;
  rod: number;
  events: Log[];
  trace: Trace[];
  result: Result | null;
  catches: Result[];
  chumAt: number;
  lineFatigue: number;
}
function random(w: World) {
  let n = w.rng | 0;
  n ^= n << 13;
  n ^= n >>> 17;
  n ^= n << 5;
  w.rng = n >>> 0;
  return w.rng / 4294967296;
}
function log(w: World, text: string, kind: Log["kind"]) {
  w.events.push({ t: w.time - w.castTime, text, kind });
}
const clone = (w: World): World => ({
  ...w,
  tackle: { ...w.tackle },
  float: { ...w.float },
  hook: { ...w.hook },
  velocity: { ...w.velocity },
  aim: { ...w.aim },
  fish: w.fish.map((f) => ({
    ...f,
    home: { ...f.home },
    target: { ...f.target },
  })),
  pellets: w.pellets.map((p) => ({ ...p })),
  events: [...w.events],
  trace: [...w.trace],
  catches: [...w.catches],
});
const hookOf = (w: World) => HOOKS.find((h) => h.id === w.tackle.hook)!;
const baitOf = (w: World) => BAITS.find((b) => b.id === w.tackle.bait)!;
export const lineStrength = (w: World) =>
  (w.tackle.line === 0.18 ? 13 : w.tackle.line === 0.22 ? 21 : 32) *
  Math.max(0.25, 1 - w.wear * 0.75);
export const slack = (w: World) =>
  Math.max(0, w.lineLength - Math.hypot(w.float.x, w.float.y));
export const reserve = (w: World) =>
  w.tackle.float - w.tackle.shot - hookOf(w).mass - baitOf(w).mass * w.bait;
function habitat(w: World, species: Species): Vec {
  const obs = siteOf(w.env).obstacles;
  let x: number, y: number;
  if (species === "bream") {
    const o = obs[Math.floor(random(w) * obs.length)];
    const a = random(w) * Math.PI * 2,
      r = o.radius * (0.65 + random(w) * 0.85);
    x = o.x + Math.cos(a) * r;
    y = o.y + Math.sin(a) * r;
  } else if (species === "small") {
    const o = obs.find((o) => o.kind === "weed") ?? obs[0];
    x = o.x + (random(w) - 0.5) * 12;
    y = o.y + (random(w) - 0.5) * 10;
  } else {
    x = (random(w) - 0.5) * 30;
    y = 22 + random(w) * 25;
  }
  x = clamp(x, -22, 22);
  y = clamp(y, 9, 51);
  const bottom = ground(w.env, x, y);
  return {
    x,
    y,
    z:
      species === "bream"
        ? Math.max(0.6, bottom - 0.3 - random(w) * 1.1)
        : species === "small"
          ? bottom * (0.35 + random(w) * 0.35)
          : bottom * (0.3 + random(w) * 0.4),
  };
}
export function createSession(env: Environment, tackle: Tackle): World {
  const w: World = {
    env: Object.freeze({ ...env }),
    rng: env.seed || 824013,
    time: 0,
    castTime: 0,
    castCount: 0,
    phase: "ready",
    tackle: { ...tackle },
    fish: [],
    pellets: [],
    float: { x: 0, y: 0, z: 0 },
    hook: { x: 0, y: 0, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    aim: { x: 0, y: 26, z: 0 },
    bait: 1,
    lineLength: 0,
    tension: 0,
    floatDip: 0,
    dipVelocity: 0,
    floatTilt: 0,
    wear: 0,
    snag: null,
    snagTime: 0,
    slackTime: 0,
    heldBy: null,
    reel: "neutral",
    drag: tackle.drag,
    rod: 45,
    events: [],
    trace: [],
    result: null,
    catches: [],
    chumAt: -100,
    lineFatigue: 0,
  };
  const breamCount = env.site === "reef" ? 14 : env.site === "harbor" ? 12 : 7;
  const bassCount = env.site === "reef" ? 7 : env.site === "harbor" ? 4 : 10;
  const roster: Species[] = Array.from({ length: 26 }, (_, i) =>
    i < breamCount ? "bream" : i < breamCount + bassCount ? "bass" : "small",
  );
  for (const species of roster) {
    const pos = habitat(w, species),
      length =
        species === "bream"
          ? 22 + random(w) * 20
          : species === "bass"
            ? 32 + random(w) * 30
            : 9 + random(w) * 8;
    w.fish.push({
      ...pos,
      id: w.fish.length,
      species,
      length,
      weight:
        Math.pow(length / 30, 3) *
        (species === "bream" ? 0.42 : species === "bass" ? 0.28 : 0.34),
      home: { ...pos },
      target: { ...pos },
      state: "patrol",
      clock: random(w) * 5,
      hunger: 0.55 + random(w) * 0.4,
      caution: 0.1 + random(w) * 0.35,
      energy: 1,
      heading: random(w) * 6.28,
      mouth: length * SPECIES[species].mouth,
      attempt: 0,
    });
  }
  return w;
}
export function cast(prev: World, aim: Vec, tackle: Tackle): World {
  if (prev.phase === "fishing" || prev.phase === "fight") return prev;
  const w = clone(prev);
  w.tackle = { ...tackle };
  w.drag = tackle.drag;
  w.castCount++;
  w.castTime = w.time;
  w.phase = "fishing";
  w.float = { x: clamp(aim.x, -18, 18), y: clamp(aim.y, 12, 47), z: 0 };
  w.aim = { ...w.float };
  w.hook = { ...w.float };
  w.velocity = { x: 0, y: 0, z: 0 };
  w.bait = 1;
  w.lineLength = Math.hypot(w.float.x, w.float.y) + 0.8;
  w.tension = 0;
  w.floatDip = 0;
  w.dipVelocity = 0;
  w.floatTilt = 0;
  w.snag = null;
  w.snagTime = 0;
  w.slackTime = 0;
  w.heldBy = null;
  w.reel = "neutral";
  w.wear = 0;
  w.lineFatigue = 0;
  w.events = [];
  w.trace = [];
  w.result = null;
  log(
    w,
    `抛投 ${Math.hypot(w.aim.x, w.aim.y).toFixed(0)} m；${w.tackle.hook} 号钩，钓棚 ${w.tackle.depth.toFixed(1)} m`,
    "action",
  );
  for (const f of w.fish)
    if (dist(f, w.hook) < 3 && f.z < 2) {
      f.state = "spooked";
      f.clock = 0;
      f.caution = clamp(f.caution + 0.25, 0, 0.95);
      log(w, "落水声惊动了浅层鱼", "fish");
    }
  record(w);
  return w;
}
export function chum(prev: World, aim: Vec): World {
  if (prev.phase === "ended" || prev.time - prev.chumAt < 4) return prev;
  const w = clone(prev);
  w.chumAt = w.time;
  for (let i = 0; i < 35; i++)
    w.pellets.push({
      x: clamp(aim.x, -20, 20) + (random(w) - 0.5) * 1.8,
      y: clamp(aim.y, 8, 50) + (random(w) - 0.5) * 1.8,
      z: 0,
      age: 0,
      life: 40 + random(w) * 35,
    });
  w.pellets = w.pellets.slice(-175);
  if (w.phase !== "ready") log(w, "撒下一把诱饵，颗粒进入表层流", "action");
  return w;
}
function end(
  w: World,
  kind: Result["kind"],
  title: string,
  detail: string,
  fish?: Fish,
) {
  w.phase = "ended";
  w.reel = "neutral";
  w.result = {
    kind,
    title,
    detail,
    duration: w.time - w.castTime,
    ...(fish
      ? {
          fish: {
            species: fish.species,
            length: fish.length,
            weight: fish.weight,
          },
        }
      : {}),
  };
  if (kind === "landed") w.catches.push(w.result);
  log(w, title, "action");
  if (w.heldBy !== null) {
    const f = w.fish.find((f) => f.id === w.heldBy)!;
    f.state = kind === "landed" ? "landed" : "spooked";
    f.clock = 0;
    f.caution = clamp(f.caution + 0.25, 0, 0.95);
  }
  w.heldBy = null;
  record(w);
}
export function retrieve(prev: World): World {
  if (prev.phase !== "fishing" && prev.phase !== "fight") return prev;
  const w = clone(prev);
  end(
    w,
    "retrieve",
    "收竿，重新判断。",
    w.snag
      ? "钩被结构留住，收竿更换了子线和钩组。复盘可查看接触发生的位置。"
      : w.bait < 0.12
        ? "回收时钩上已经没有有效饵体。可回看啄食与挂擦记录，换饵再试。"
        : "这一竿的鱼群、诱饵和钩饵轨迹已保留。鱼群会留在场内，下一竿仍会受到惊扰和饥饿状态影响。",
  );
  return w;
}
export function strike(prev: World): World {
  if (prev.phase !== "fishing") return prev;
  const w = clone(prev),
    f = w.fish.find((f) => f.id === w.heldBy);
  log(w, "扬竿", "action");
  if (w.snag) {
    w.tension += 8;
    w.wear = clamp(w.wear + 0.13, 0, 1);
    log(w, "扬竿力量落在挂点，子线受到磨损", "line");
    if (w.tension > lineStrength(w))
      end(
        w,
        "broken",
        "断在了挂点。",
        "钩没有离开结构，扬竿增加了挂点受力。尝试先放松主线，再小幅收线。",
      );
    return w;
  }
  if (!f || (f.state !== "run" && f.state !== "take")) {
    end(
      w,
      "miss",
      "空竿。",
      w.bait < 0.1
        ? "饵已被啄掉，水面的变化不能证明钩还在鱼嘴里。"
        : f?.state === "nibble"
          ? "鱼只啄到了饵体，钩还没有进入口中。"
          : "扬竿时没有鱼含住钩。水面变化可能来自浪、风压主线或钓组运动。",
    );
    return w;
  }
  const gape = hookOf(w).gape;
  const fit = clamp(1 - Math.abs(gape / f.mouth - 0.65) * 0.8, 0.15, 0.98);
  const transmission = clamp(1 - slack(w) * 0.27, 0.05, 1);
  const acceptance = f.state === "run" ? 0.96 : 0.43;
  if (random(w) < fit * transmission * acceptance) {
    f.state = "hooked";
    f.clock = 0;
    w.phase = "fight";
    w.reel = "neutral";
    log(w, `${SPECIES[f.species].name} 中钩，开始冲刺`, "fish");
  } else {
    end(
      w,
      "miss",
      "没能刺牢。",
      transmission < 0.55
        ? "主线余量较大，扬竿力量先用于消除松弛，钩没有有效刺入。"
        : f.state === "take"
          ? "鱼刚含饵，还未转身带线。钩在口中的位置与力量方向都不稳定。"
          : "钩门与鱼口的适配、钩的位置和扬竿传力共同决定了这次未刺牢。",
    );
  }
  return w;
}
function move(f: Fish, target: Vec, speed: number, dt: number, e: Environment) {
  const dx = target.x - f.x,
    dy = target.y - f.y,
    dz = target.z - f.z,
    d = Math.hypot(dx, dy, dz);
  if (d > 0.03) {
    const k = Math.min(1, (speed * dt) / d);
    f.x += dx * k;
    f.y += dy * k;
    f.z += dz * k;
    f.heading = Math.atan2(dy, dx);
  }
  f.x = clamp(f.x, -25, 25);
  f.y = clamp(f.y, 5, 57);
  f.z = clamp(f.z, 0.3, ground(e, f.x, f.y) - 0.18);
}
function transition(w: World, f: Fish, state: FishState, text?: string) {
  f.state = state;
  f.clock = 0;
  if (text) log(w, text, "fish");
}
function fishTick(w: World, dt: number) {
  for (const f of w.fish) {
    if (f.state === "landed" || f.state === "hooked") continue;
    f.clock += dt;
    f.hunger = clamp(f.hunger + dt * 0.0007, 0.05, 1);
    const sp = SPECIES[f.species];
    const canFeed = w.phase === "fishing" && w.bait > 0.08 && !w.snag;
    if (f.state === "spooked") {
      move(
        f,
        { x: f.home.x + Math.cos(f.heading) * 5, y: f.home.y + 4, z: f.home.z },
        sp.speed * 1.9,
        dt,
        w.env,
      );
      if (f.clock > 12) transition(w, f, "patrol");
      continue;
    }
    if (f.state === "take" || f.state === "run") {
      if (w.heldBy !== f.id) {
        transition(w, f, "patrol");
        continue;
      }
      if (f.state === "take") {
        move(f, { ...w.hook }, 0.1, dt, w.env);
        if (f.clock > 0.7 + f.caution)
          transition(w, f, "run", "鱼含饵转身，开始带走钩饵");
      } else {
        move(
          f,
          {
            x: f.x + Math.cos(f.heading) * 3,
            y: f.y + Math.sin(f.heading) * 3,
            z: f.z + (f.species === "bass" ? -0.25 : 0.15),
          },
          sp.speed * (0.8 + f.hunger),
          dt,
          w.env,
        );
      }
      const resistance =
        w.tension + Math.max(0, hookOf(w).gape / f.mouth - 0.7) * 2;
      if (
        f.clock > 2.5 + f.hunger * 2.5 ||
        (f.clock > 1 &&
          random(w) < dt * (0.018 + resistance * 0.008 + f.caution * 0.09))
      ) {
        w.bait *= 0.7;
        w.heldBy = null;
        transition(w, f, "spooked", "鱼感到阻力，吐饵离开");
        f.caution = clamp(f.caution + 0.16, 0, 0.9);
      }
      continue;
    }
    if (f.state === "nibble") {
      if (!canFeed || w.heldBy !== null) {
        transition(w, f, "patrol");
        continue;
      }
      move(f, w.hook, sp.speed * 0.6, dt, w.env);
      if (f.clock > 0.45) {
        w.bait = Math.max(0, w.bait - (0.05 + random(w) * 0.09));
        f.hunger = Math.max(0.1, f.hunger - 0.035);
        log(w, `${SPECIES[f.species].name} 啄掉一部分饵，未含住钩`, "fish");
        f.attempt++;
        transition(w, f, "patrol");
        f.target = { ...f.home, x: f.home.x + (random(w) - 0.5) * 4 };
      }
      continue;
    }
    if (f.state === "inspect") {
      if (!canFeed || w.heldBy !== null || dist(f, w.hook) > 2) {
        transition(w, f, "patrol");
        continue;
      }
      move(
        f,
        { ...w.hook, x: w.hook.x + 0.2 * Math.sin(w.time + f.id) },
        sp.speed * 0.5,
        dt,
        w.env,
      );
      if (f.clock > 1 + f.caution * 2) {
        const gape = hookOf(w).gape,
          baitSize = baitOf(w).size;
        const oversized = gape > f.mouth * 1.05 || baitSize > f.mouth * 1.4;
        const appetite =
          f.hunger *
          sp.bold *
          (w.env.time === "day" ? 0.86 : 1.12) *
          (1 - f.caution * 0.6);
        const visibleHook = clamp(gape / (baitSize * 0.8 + 2) - 1, 0, 1);
        const foodPreference =
          f.species === "bass"
            ? w.tackle.bait === "shrimp"
              ? 1.15
              : w.tackle.bait === "worm"
                ? 0.55
                : 0.85
            : w.tackle.bait === "worm"
              ? 1.08
              : 1;
        const visibleLeader = clamp(
          ((w.tackle.line - 0.18) * 2 * w.env.clarity) / 6,
          0,
          0.4,
        );
        const accept =
          appetite *
          foodPreference *
          (1 - visibleLeader) *
          (1 - visibleHook * 0.35) *
          (1 - clamp(w.tension / 10, 0, 0.6));
        if (oversized || f.species === "small") transition(w, f, "nibble");
        else if (random(w) < accept) {
          w.heldBy = f.id;
          f.heading = random(w) * Math.PI * 2;
          transition(
            w,
            f,
            "take",
            `${SPECIES[f.species].name} 吸入钩饵，尚未拉紧钓线`,
          );
        } else {
          transition(w, f, "spooked", "鱼试探后放弃了这次饵");
          f.caution = clamp(f.caution + 0.06, 0, 0.9);
        }
      }
      continue;
    }
    const hookDistance = dist(f, w.hook),
      vision = Math.max(1, w.env.clarity * (w.env.time === "day" ? 1 : 0.8));
    if (
      canFeed &&
      w.heldBy === null &&
      hookDistance < vision &&
      f.hunger > 0.25 &&
      f.clock > 1
    ) {
      move(f, w.hook, sp.speed, dt, w.env);
      if (hookDistance < 0.4)
        transition(
          w,
          f,
          "inspect",
          `${SPECIES[f.species].name} 接近钩饵，停下来试探`,
        );
      continue;
    }
    let nearest: Pellet | undefined,
      nd = Infinity;
    for (const p of w.pellets) {
      const d = dist(f, p);
      if (d < nd && d < Math.max(4, vision * 1.8)) {
        nearest = p;
        nd = d;
      }
    }
    if (nearest && f.hunger > 0.2) {
      if (f.state !== "forage") transition(w, f, "forage");
      move(f, nearest, sp.speed * 0.9, dt, w.env);
      if (nd < 0.25) {
        nearest.life = 0;
        f.hunger = clamp(f.hunger - 0.045, 0.05, 1);
      }
    } else {
      if (f.clock > 5 || dist(f, f.target) < 0.3) {
        f.target = {
          x: clamp(
            f.home.x + (random(w) - 0.5) * (f.species === "bass" ? 20 : 7),
            -22,
            22,
          ),
          y: clamp(f.home.y + (random(w) - 0.5) * 10, 6, 54),
          z: f.home.z + (random(w) - 0.5),
        };
        f.clock = 0;
        f.state = "patrol";
      }
      move(f, f.target, sp.speed * 0.36, dt, w.env);
    }
  }
}
function fightTick(w: World, dt: number) {
  const f = w.fish.find((f) => f.id === w.heldBy);
  if (!f) {
    end(w, "lost", "鱼脱离了钓组。", "钩口失去连接。");
    return;
  }
  f.clock += dt;
  const burst = Math.sin(f.clock * 1.65 + f.id) > 0.55 ? 1.55 : 0.8;
  const pull = (2 + f.weight * 7) * (0.2 + 0.8 * f.energy) * burst;
  const r = Math.hypot(f.x, f.y),
    reeling = w.reel === "reel";
  const pressure = Math.min(
    pull + (reeling ? 2 : 0),
    w.drag * (1 + 0.1 * burst),
  );
  w.tension = pressure;
  const give = pull > w.drag ? (pull - w.drag) * 0.17 : 0;
  if (give > 0) w.lineLength = Math.min(65, w.lineLength + give * dt);
  const take = reeling
    ? 1.4 * Math.min(1, w.drag / Math.max(1, pull)) * (0.7 + w.rod / 150)
    : 0;
  const motion = give - take;
  f.x +=
    (f.x / Math.max(1, r)) * motion * dt + Math.sin(f.clock * 0.9) * 0.16 * dt;
  f.y += (f.y / Math.max(1, r)) * motion * dt;
  f.z = clamp(
    f.z + Math.sin(f.clock) * 0.12 * dt,
    0.4,
    ground(w.env, f.x, f.y) - 0.1,
  );
  if (reeling) w.lineLength = Math.max(1, w.lineLength - take * dt);
  if (w.reel === "feed") w.lineLength += 1.5 * dt;
  f.energy = clamp(f.energy - (0.005 + pressure * 0.002) * dt, 0, 1);
  const looseness = Math.max(
    0,
    w.lineLength - Math.hypot(f.x, f.y) - w.tackle.depth * 0.25,
  );
  w.slackTime =
    looseness > 3 ? w.slackTime + dt : Math.max(0, w.slackTime - dt);
  if (
    substrate(w.env, f.x, f.y) === "rock" &&
    f.z > ground(w.env, f.x, f.y) - 0.6
  )
    w.wear = clamp(w.wear + pressure * 0.0015 * dt, 0, 1);
  const limit = Math.min(lineStrength(w), hookOf(w).hold);
  w.lineFatigue =
    pressure > limit
      ? w.lineFatigue + (pressure / limit - 1) * dt
      : Math.max(0, w.lineFatigue - dt * 0.25);
  if (w.lineFatigue > 0.6) {
    end(
      w,
      "broken",
      "钓组没能承受这次冲刺。",
      hookOf(w).hold < lineStrength(w)
        ? "小钩的承力极限先被超过。钩号更小容易入口，但不能承受任意大的拉力。"
        : "冲刺张力超过了子线剩余强度。礁石磨损与过紧的泄力会进一步缩小余量。",
      f,
    );
    return;
  }
  if (w.slackTime > 3 && random(w) < dt * 0.3) {
    end(
      w,
      "lost",
      "松线后，鱼脱钩了。",
      "连续松弛让钩口失去稳定受力。下次把泄力放松与完全卸掉张力区分开。",
      f,
    );
    return;
  }
  if (r > 59) {
    end(w, "lost", "鱼冲出了可控范围。", "泄力持续出线，未能把鱼引回近岸。", f);
    return;
  }
  if (r < 5 && f.energy < 0.4) {
    end(
      w,
      "landed",
      "稳稳带到近岸。",
      "鱼的冲刺已减弱，收线时保持了连续张力。已记录这条鱼，场内其他鱼继续保留原有状态。",
      f,
    );
    return;
  }
  w.hook = { x: f.x, y: f.y, z: f.z };
  const ratio = Math.min(1, w.tackle.depth / Math.max(0.1, f.z));
  w.float.x += (f.x - w.float.x) * dt * 2;
  w.float.y += (f.y - w.float.y) * dt * 2;
  w.float.z = Math.max(0, f.z - w.tackle.depth) * ratio;
}
function rigTick(w: World, dt: number) {
  const f = w.fish.find((f) => f.id === w.heldBy),
    c = current(w.env, w.float),
    hc = current(w.env, w.hook);
  const wind = w.env.wind * (0.7 + 0.3 * Math.sin(w.time * 0.38));
  if (w.reel === "feed") w.lineLength = Math.min(65, w.lineLength + 1.5 * dt);
  if (w.reel === "reel") w.lineLength = Math.max(2, w.lineLength - 1.25 * dt);
  w.float.x += (c.x + wind * 0.008) * dt;
  w.float.y += c.y * dt;
  w.float.z = Math.max(
    0,
    w.float.z + (reserve(w) < 0 ? -reserve(w) * 0.2 : -0.3) * dt,
  );
  const reach = Math.hypot(w.float.x, w.float.y),
    excess = Math.max(0, reach - w.lineLength);
  w.tension = excess * 1.9;
  if (excess > 0) {
    w.float.x -= (w.float.x / reach) * Math.min(excess, 0.9 * dt);
    w.float.y -= (w.float.y / reach) * Math.min(excess, 0.9 * dt);
  }
  if (w.snag) {
    w.snagTime += dt;
    w.tension += Math.max(0, dist(w.float, w.hook) - w.tackle.depth) * 2.4;
    w.wear = clamp(w.wear + w.tension * 0.0008 * dt, 0, 1);
    const relaxed = slack(w) > 1.8 && w.reel === "feed";
    w.slackTime = relaxed ? w.slackTime + dt : 0;
    if (
      w.slackTime > 1.5 &&
      random(w) < dt * (w.snag === "weed" ? 0.75 : 0.24)
    ) {
      log(
        w,
        w.snag === "weed"
          ? "松线后钩脱离了水草"
          : "松线改变了受力方向，钩脱离礁缝",
        "line",
      );
      w.snag = null;
      w.slackTime = 0;
      w.hook.z -= 0.15;
    }
    if (w.tension > lineStrength(w)) {
      end(
        w,
        "broken",
        "子线断在结构边缘。",
        "挂点限制了钩的移动，继续收线使张力超过磨损后子线的承力。",
      );
    }
  } else if (f && (f.state === "take" || f.state === "run")) {
    w.hook = { x: f.x, y: f.y, z: f.z };
    const length = dist(w.float, w.hook),
      pull = Math.max(0, length - w.tackle.depth + 0.12);
    w.tension += pull * (f.state === "run" ? 3 : 1);
    if (pull > 0) {
      w.float.x += ((f.x - w.float.x) / length) * pull * 0.7 * dt;
      w.float.y += ((f.y - w.float.y) / length) * pull * 0.7 * dt;
    }
  } else {
    const load = w.tackle.shot + hookOf(w).mass + baitOf(w).mass * w.bait;
    const terminal = 0.18 + 0.36 * Math.sqrt(load);
    w.velocity.x += (hc.x - w.velocity.x) * dt * 1.5;
    w.velocity.y += (hc.y - w.velocity.y) * dt * 1.5;
    w.velocity.z += (terminal - w.velocity.z) * dt * 2;
    w.hook.x += w.velocity.x * dt;
    w.hook.y += w.velocity.y * dt;
    w.hook.z += w.velocity.z * dt;
    const length = dist(w.float, w.hook);
    if (length > w.tackle.depth) {
      const k = w.tackle.depth / length;
      w.hook.x = w.float.x + (w.hook.x - w.float.x) * k;
      w.hook.y = w.float.y + (w.hook.y - w.float.y) * k;
      w.hook.z = w.float.z + (w.hook.z - w.float.z) * k;
      w.velocity.z *= 0.6;
    }
    const bottom = ground(w.env, w.hook.x, w.hook.y),
      material = substrate(w.env, w.hook.x, w.hook.y);
    if (w.hook.z >= bottom - (material === "weed" ? 0.5 : 0.03)) {
      w.hook.z = Math.min(w.hook.z, bottom);
      w.velocity.z = 0;
      w.velocity.x *= material === "sand" ? 0.92 : 0.4;
      w.velocity.y *= 0.5;
      w.bait = Math.max(0, w.bait - dt * 0.002);
      if (!w.events.some((e) => e.text.includes("首次接触")))
        log(
          w,
          `钩饵首次接触${material === "rock" ? "礁石" : material === "weed" ? "水草" : "砂底"}`,
          "environment",
        );
      if (
        material !== "sand" &&
        random(w) <
          dt *
            (material === "rock" ? 0.06 : 0.035) *
            (hookOf(w).gape / 6) *
            (1 + w.tension * 0.2)
      ) {
        w.snag = material;
        w.snagTime = 0;
        log(w, material === "rock" ? "钩尖卡入礁缝" : "钩被水草缠住", "line");
      }
    }
  }
  if (w.phase === "ended") return;
  const nibble = w.fish.some(
    (f) => f.state === "nibble" && dist(f, w.hook) < 0.6,
  )
    ? Math.sin(w.time * 17) * 0.055
    : 0;
  const unloading =
    w.hook.z >= ground(w.env, w.hook.x, w.hook.y) - 0.04 ? -0.12 : 0;
  const extra =
    w.heldBy !== null
      ? Math.max(0, dist(w.float, w.hook) - w.tackle.depth) * 0.32
      : 0;
  const target = clamp(
    w.tension * 0.055 + extra + nibble + unloading + w.float.z,
    -0.2,
    1.2,
  );
  w.dipVelocity += (target - w.floatDip) * 16 * dt - w.dipVelocity * 5 * dt;
  w.floatDip += w.dipVelocity * dt;
  w.floatTilt +=
    (clamp((c.x - hc.x) * 28 + w.tension * 1.8, -32, 32) - w.floatTilt) *
    dt *
    2;
  if (w.bait <= 0.08 && !w.events.some((e) => e.text.includes("饵已耗尽")))
    log(w, "饵已耗尽，钩不再吸引新的入口", "environment");
  if (reach < 4 && w.reel === "reel")
    end(
      w,
      "retrieve",
      "钓组回到近岸。",
      "已收回钓组，可以换饵或重新配置后再抛。",
    );
  if (Math.abs(w.float.x) > 29 || w.float.y > 58 || w.float.y < 2)
    end(
      w,
      "retrieve",
      "钓组漂出了作钓区。",
      "流把钓组带出了这段岸线的可控范围。下一竿可选上游落点，或更早收线。",
    );
}
function record(w: World) {
  w.trace.push({
    t: w.time - w.castTime,
    hook: { ...w.hook },
    float: { ...w.float },
    fish: w.fish
      .filter((f) => f.state !== "landed")
      .map((f) => ({ x: f.x, y: f.y, z: f.z, species: f.species })),
    pellets: w.pellets.map((p) => ({ x: p.x, y: p.y, z: p.z })),
    bait: w.bait,
    tension: w.tension,
    dip: w.floatDip,
    events: w.events.length,
  });
  if (w.trace.length > 1200) w.trace.shift();
}
export function tick(prev: World, dt = DT): World {
  if (prev.phase === "ended") return prev;
  const w = clone(prev);
  w.time += dt;
  w.pellets = w.pellets
    .map((p) => {
      const c = current(w.env, p);
      return {
        ...p,
        age: p.age + dt,
        x: p.x + c.x * dt + Math.sin(p.age * 1.7 + p.life) * 0.06 * dt,
        y: p.y + c.y * dt + Math.cos(p.age + p.life) * 0.06 * dt,
        z: Math.min(
          ground(w.env, p.x, p.y),
          p.z + (0.15 + (p.life % 7) * 0.015) * dt,
        ),
      };
    })
    .filter((p) => p.age < p.life && p.x > -30 && p.x < 30);
  fishTick(w, dt);
  if (w.phase === "fishing") rigTick(w, dt);
  else if (w.phase === "fight") {
    fightTick(w, dt);
    w.floatDip += (clamp(w.tension * 0.06, 0, 1.2) - w.floatDip) * dt * 3;
  }
  if (
    w.phase !== "ready" &&
    w.phase !== "ended" &&
    Math.floor((w.time - w.castTime) * 4) >
      Math.floor((prev.time - prev.castTime) * 4)
  )
    record(w);
  if (w.phase !== "ready" && w.phase !== "ended" && w.time - w.castTime >= 180)
    end(
      w,
      "timeout",
      "这一竿的观察结束。",
      "已漂流三分钟，收回钓组检查饵和子线。鱼没有入口也是有效结果，可换落点、水层或钩饵再试。",
    );
  return w;
}
