/** A deterministic, deliberately simplified teaching world. Metres, seconds,
 * and water-equivalent gram loads. Rendering never advances this state. */
export const STEP = 1 / 30;
export const ROUND_LENGTH = 32;
export const WORLD_WIDTH = 42;
export const WATER_DEPTH = 8;
export type Cause = "fish" | "wave" | "wind" | "bottom";
export type Guess = Cause | "unsure";
export type FishPhase =
  | "cruise"
  | "approach"
  | "inspect"
  | "bite"
  | "carry"
  | "escape";
export interface Setup {
  shot: number;
  depth: number;
  flow: number;
  wind: number;
  wave: number;
  capacity: number;
}
export const DEFAULT_SETUP: Setup = {
  shot: 0.9,
  depth: 4,
  flow: 0.35,
  wind: 1,
  wave: 0.12,
  capacity: 1.8,
};
export interface Point {
  x: number;
  depth: number;
}
export interface Particle extends Point {
  age: number;
  seed: number;
}
export interface Fish extends Point {
  phase: FishPhase;
  phaseTime: number;
  direction: number;
}
export interface Event {
  time: number;
  label: string;
  type: "action" | "water" | "fish" | "signal";
}
export interface Outcome {
  title: string;
  reason: string;
  action: "strike" | "wait" | "timeout";
  good: boolean;
  actual: string;
  guess?: Guess;
}
export interface World {
  time: number;
  seed: number;
  aim: number;
  mode: "explore" | "challenge";
  cause: Cause;
  float: Point;
  hook: Point;
  fish: Fish;
  particles: Particle[];
  trail: Point[];
  setup: Setup;
  dip: number;
  side: number;
  wave: number;
  reserve: number;
  bottom: boolean;
  signalStarted: number | null;
  contactStarted: number | null;
  biteStarted: number | null;
  eventStarted: number | null;
  tension: number;
  events: Event[];
  outcome: Outcome | null;
}
export const clamp = (n: number, a: number, b: number) =>
  Math.max(a, Math.min(b, n));
export const distance = (a: Point, b: Point) =>
  Math.hypot(a.x - b.x, a.depth - b.depth);
export const bottomAt = (x: number) =>
  7.3 -
  2.8 * Math.exp(-Math.pow((x - 29) / 3.4, 2)) -
  0.25 * Math.sin(x * 0.55);
export function rigModel(p: Setup) {
  const load = p.shot + 0.2;
  const reserve = p.capacity - load;
  const tilt = Math.atan((p.flow * 0.9 - p.wind * 0.022) / (p.shot + 0.36));
  return {
    reserve,
    load,
    tilt,
    targetDepth: p.depth * Math.cos(tilt),
    offset: p.depth * Math.sin(tilt),
    sink: (0.11 + 0.34 * Math.sqrt(load)) / (1 + p.depth * 0.035),
    delay: 0.4 + p.depth * 0.12,
    exposure: clamp(reserve / (p.capacity + 0.45), 0, 1),
  };
}
export function event(w: World, label: string, type: Event["type"]) {
  w.events.push({ time: Number(w.time.toFixed(2)), label, type });
}
export function createWorld(
  setup: Setup = { ...DEFAULT_SETUP },
  aim = 18,
  mode: World["mode"] = "explore",
  seed = 1,
): World {
  const causes: Cause[] = ["fish", "wave", "wind", "bottom"];
  const cause = causes[Math.abs(seed) % causes.length];
  const p = { ...setup };
  if (mode === "challenge") {
    Object.assign(p, DEFAULT_SETUP, { flow: 0.24, wave: 0.13, wind: 1 });
    if (cause === "bottom") {
      aim = 27;
      p.depth = 6.2;
    }
  }
  return {
    time: 0,
    seed,
    aim,
    mode,
    cause,
    float: { x: aim, depth: 0 },
    hook: { x: aim, depth: 0 },
    fish: {
      x: aim + 4,
      depth: 3.7,
      phase: "cruise",
      phaseTime: 0,
      direction: -1,
    },
    particles: [],
    trail: [],
    setup: p,
    dip: 0,
    side: 0,
    wave: 0,
    reserve: rigModel(p).reserve,
    bottom: false,
    signalStarted: null,
    contactStarted: null,
    biteStarted: null,
    eventStarted: null,
    tension: 0,
    events: [
      { time: 0, label: `抛向 ${aim.toFixed(0)} m 的落点`, type: "action" },
    ],
    outcome: null,
  };
}
function setFish(w: World, phase: FishPhase, label: string) {
  if (w.fish.phase === phase) return;
  w.fish.phase = phase;
  w.fish.phaseTime = 0;
  event(w, label, "fish");
}
export function feed(w: World, at = w.aim): World {
  if (w.outcome) return w;
  const next = copy(w);
  for (let i = 0; i < 26; i++)
    next.particles.push({
      x: at + ((i % 7) - 3) * 0.13,
      depth: 0,
      age: 0,
      seed: i + next.events.length * 31,
    });
  next.particles = next.particles.slice(-104);
  event(next, `在 ${at.toFixed(0)} m 处撒饵`, "action");
  return next;
}
export function copy(w: World): World {
  return {
    ...w,
    setup: { ...w.setup },
    float: { ...w.float },
    hook: { ...w.hook },
    fish: { ...w.fish },
    particles: w.particles.map((p) => ({ ...p })),
    trail: w.trail.map((p) => ({ ...p })),
    events: [...w.events],
  };
}
export function tick(previous: World, dt = STEP): World {
  if (previous.outcome || previous.time >= ROUND_LENGTH) return previous;
  const w = copy(previous),
    p = w.setup,
    b = rigModel(p);
  w.time = Math.min(ROUND_LENGTH, w.time + dt);
  w.reserve = b.reserve;
  const t = w.time;
  if (t < 1.15) {
    const u = t / 1.15;
    w.float = { x: 2 + (w.aim - 2) * u, depth: -Math.sin(u * Math.PI) * 2.2 };
    w.hook = { ...w.float };
    return w;
  }
  if (previous.time < 1.15) {
    w.float = { x: w.aim, depth: 0 };
    w.hook = { ...w.float };
    event(w, "钓组入水，钩饵开始下沉", "water");
  }
  const environmental = w.mode === "challenge" && w.cause !== "fish";
  const windEvent = environmental && w.cause === "wind" && t > 8;
  const waveEvent = environmental && w.cause === "wave" && t > 8;
  if ((windEvent || waveEvent) && w.eventStarted === null) {
    w.eventStarted = t;
    event(w, windEvent ? "侧风先推动水面的主线" : "一组浪涌经过阿波", "water");
  }
  const localWind = p.wind + (windEvent ? 5 : 0);
  const velocity = p.flow * 0.55 + localWind * 0.014;
  w.float.x = clamp(w.float.x + velocity * dt, 2, WORLD_WIDTH - 4);
  w.float.depth = clamp(
    w.float.depth + (b.reserve < 0 ? -b.reserve * 0.22 : -0.4) * dt,
    0,
    3,
  );
  const bottom = bottomAt(w.hook.x);
  const targetDepth = Math.min(bottom, b.targetDepth + w.float.depth);
  const offset = b.offset - (windEvent ? 1.4 : 0);
  w.hook.x += (w.float.x + offset - w.hook.x) * Math.min(1, dt * 0.8);
  w.hook.depth +=
    Math.sign(targetDepth - w.hook.depth) *
    Math.min(Math.abs(targetDepth - w.hook.depth), b.sink * dt);
  w.hook.depth = clamp(w.hook.depth, 0, bottomAt(w.hook.x));
  w.bottom = w.hook.depth >= bottomAt(w.hook.x) - 0.03;
  if (w.bottom && w.contactStarted === null) {
    w.contactStarted = t;
    event(w, "钩饵接触海底，部分负载由海底支撑", "water");
  }
  if (b.reserve < 0 && !w.events.some((e) => e.label.startsWith("配重超过")))
    event(w, "配重超过承载量，阿波自身开始下沉", "signal");
  w.particles = w.particles
    .map((v) => ({
      ...v,
      age: v.age + dt,
      x:
        v.x +
        (p.flow * (0.86 + 0.13 * Math.sin(v.seed)) +
          Math.sin(t * 0.6 + v.seed) * 0.025) *
          dt,
      depth: v.depth + (0.22 + 0.06 * Math.sin(v.seed * 2)) * dt,
    }))
    .filter((v) => v.age < 28 && v.depth < bottomAt(v.x));
  const nearFood = w.particles.some((v) => distance(v, w.fish) < 5.5);
  const canBite =
    !environmental && !w.bottom && b.reserve > 0 && w.hook.depth > 1.7;
  w.fish.phaseTime += dt;
  switch (w.fish.phase) {
    case "cruise": {
      w.fish.x += Math.sin(t * 0.35 + w.seed) * dt * 0.25;
      w.fish.depth = 3.5 + Math.sin(t * 0.45) * 0.18;
      if (
        canBite &&
        ((w.mode === "challenge" && t > 6) ||
          nearFood ||
          distance(w.fish, w.hook) < 1.7)
      )
        setFish(w, "approach", "鱼转向钩饵，开始接近");
      break;
    }
    case "approach": {
      const d = distance(w.fish, w.hook);
      const speed = Math.min(1, (dt * 1.15) / Math.max(0.05, d));
      w.fish.direction = w.hook.x < w.fish.x ? -1 : 1;
      w.fish.x += (w.hook.x - w.fish.x) * speed;
      w.fish.depth += (w.hook.depth - w.fish.depth) * speed;
      if (d < 0.32) setFish(w, "inspect", "鱼停在饵旁试探，尚未含住钩饵");
      break;
    }
    case "inspect":
      w.fish.x = w.hook.x + 0.26;
      w.fish.depth = w.hook.depth;
      w.fish.direction = -1;
      if (!canBite) setFish(w, "escape", "环境变化，鱼放弃接近");
      else if (w.fish.phaseTime > 1.3)
        setFish(w, "bite", "鱼吸入钩饵，子线还未完全绷紧");
      break;
    case "bite":
      w.fish.x = w.hook.x + 0.22;
      w.fish.depth = w.hook.depth;
      if (w.biteStarted === null) w.biteStarted = t;
      if (w.fish.phaseTime > 0.85)
        setFish(w, "carry", "鱼含饵转身，开始拉直子线");
      break;
    case "carry": {
      const u = w.fish.phaseTime;
      w.hook.x += Math.min(u * 0.35, 1.5) * dt;
      w.hook.depth = clamp(w.hook.depth + 0.22 * dt, 0, bottomAt(w.hook.x));
      w.fish.x = w.hook.x + 0.24;
      w.fish.depth = w.hook.depth;
      w.fish.direction = -1;
      if (u > b.delay && w.signalStarted === null) {
        w.signalStarted = t;
        event(w, "持续牵引传到阿波：漂向侧下方移动", "signal");
      }
      if (u > 5.2) setFish(w, "escape", "鱼吐饵离开，持续牵引消失");
      break;
    }
    case "escape":
      w.fish.direction = 1;
      w.fish.x += dt * 1.3;
      w.fish.depth += dt * 0.08;
      break;
  }
  const carry =
    w.fish.phase === "carry" ? Math.max(0, w.fish.phaseTime - b.delay) : 0;
  const waveHeight = p.wave + (waveEvent ? 0.52 : 0);
  w.wave = Math.sin(t * 2.1) * waveHeight * 0.5;
  const bottomAge = w.contactStarted === null ? 0 : t - w.contactStarted;
  const bottomDip = w.bottom
    ? bottomAge < 1.2
      ? -0.12
      : Math.min(0.4, (bottomAge - 1.2) * 0.11)
    : 0;
  const targetDip =
    carry > 0
      ? Math.min(0.72, carry * 0.35)
      : windEvent
        ? Math.min(0.38, (t - 8) * 0.12)
        : bottomDip;
  w.dip += (targetDip - w.dip) * Math.min(1, dt * 5);
  w.side =
    carry > 0
      ? Math.min(0.9, carry * 0.45)
      : windEvent
        ? Math.min(0.7, (t - 8) * 0.1)
        : 0;
  w.tension = Math.max(
    0,
    p.shot + 0.2 + (carry > 0 ? carry * 0.5 : 0) + (windEvent ? 0.4 : 0),
  );
  if (Math.floor(t * 5) > Math.floor(previous.time * 5))
    w.trail = [...w.trail.slice(-99), { ...w.hook }];
  if (t >= ROUND_LENGTH) return decide(w, "timeout");
  return w;
}
export const CAUSE_LABEL: Record<Cause, string> = {
  fish: "鱼含饵后游动",
  wave: "浪涌",
  wind: "风压主线",
  bottom: "钩饵触底",
};
export function diagnose(w: World) {
  if (w.reserve < 0)
    return {
      actual: "配重过重",
      reason:
        "钓组的等效负载已经超过阿波承载量。漂下沉来自自身失衡，不能据此认为鱼吃饵。",
    };
  if (w.bottom)
    return {
      actual: CAUSE_LABEL.bottom,
      reason:
        "钩饵先碰底卸重，随后被水流拉紧。钓棚与海底接触，比漂顶单次下沉更能解释这段过程。",
    };
  if (w.mode === "challenge" && w.cause === "wave" && w.eventStarted !== null)
    return {
      actual: CAUSE_LABEL.wave,
      reason:
        "漂与附近水面按同一个节奏起落，每次都恢复。没有独立于浪的持续单向牵引。",
    };
  if (w.mode === "challenge" && w.cause === "wind" && w.eventStarted !== null)
    return {
      actual: CAUSE_LABEL.wind,
      reason:
        "水面主线先被风吹出弧线，随后阿波才被拉偏。力来自竿端这一侧，而不是鱼钩这一侧。",
    };
  if (w.biteStarted !== null)
    return {
      actual: CAUSE_LABEL.fish,
      reason:
        "鱼先吸饵，再转身拉直子线，最后阿波才侧移下沉。水下吃饵与水面信号之间确实有延迟。",
    };
  return {
    actual: "尚未出现可靠吃口",
    reason:
      "鱼尚未含住钩饵。再看一会儿，或让诱饵与钩饵进入同一水层，不必因为等待而急着扬竿。",
  };
}
export function decide(
  w: World,
  action: Outcome["action"],
  guess?: Guess,
): World {
  if (w.outcome) return w;
  const n = copy(w),
    diagnosis = diagnose(w);
  const ready =
    w.fish.phase === "carry" &&
    w.fish.phaseTime > rigModel(w.setup).delay &&
    w.reserve >= 0 &&
    !w.bottom;
  const good = action === "strike" ? ready : !ready;
  const title =
    action === "timeout"
      ? "观察结束，回看过程。"
      : action === "strike"
        ? ready
          ? "这次，证据足够了。"
          : w.fish.phase === "bite" || w.fish.phase === "inspect"
            ? "你比信号快了一步。"
            : "漂动了，但理由不对。"
        : ready
          ? "鱼已经持续带走了。"
          : "你给判断留了余地。";
  n.outcome = { ...diagnosis, title, action, good, guess };
  event(
    n,
    action === "strike"
      ? "你选择扬竿"
      : action === "wait"
        ? "你选择等待"
        : "观察结束",
    "action",
  );
  return n;
}
export const snapshot = (w: World) => ({ ...copy(w), events: [...w.events] });
