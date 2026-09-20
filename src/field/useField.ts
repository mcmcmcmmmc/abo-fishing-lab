import { useEffect, useRef, useState } from "react";
import {
  cast,
  chum,
  createSession,
  DT,
  retrieve,
  strike,
  tick,
  type World,
} from "./engine";
import type { Environment, Tackle, Vec } from "./data";
export function useField() {
  const live = useRef<World | null>(null);
  const [world, setWorld] = useState<World | null>(null),
    [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || !world || world.phase === "ended") return;
    let id = 0,
      last = 0,
      acc = 0;
    const frame = (now: number) => {
      if (last) acc += Math.min(0.12, (now - last) / 1000);
      last = now;
      let updated = false;
      while (acc >= DT && live.current && live.current.phase !== "ended") {
        live.current = tick(live.current);
        acc -= DT;
        updated = true;
      }
      if (updated) setWorld(live.current);
      id = requestAnimationFrame(frame);
    };
    id = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(id);
  }, [paused, world?.phase]);
  const update = (fn: (w: World) => World) => {
    if (live.current) {
      live.current = fn(live.current);
      setWorld(live.current);
    }
  };
  return {
    world,
    paused,
    setPaused,
    enter: (e: Environment, t: Tackle) => {
      live.current = createSession(e, t);
      setWorld(live.current);
      setPaused(false);
    },
    exit: () => {
      live.current = null;
      setWorld(null);
    },
    cast: (p: Vec, t: Tackle) => {
      update((w) => cast(w, p, t));
      setPaused(false);
    },
    chum: (p: Vec) => update((w) => chum(w, p)),
    strike: () => update(strike),
    retrieve: () => update(retrieve),
    control: (key: "reel" | "drag" | "rod", value: World["reel"] | number) =>
      update((w) => ({ ...w, [key]: value })),
  };
}
