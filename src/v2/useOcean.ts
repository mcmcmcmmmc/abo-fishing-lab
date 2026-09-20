import { useEffect, useRef, useState } from "react";
import {
  createWorld,
  tick,
  feed,
  decide,
  snapshot,
  rigModel,
  STEP,
  ROUND_LENGTH,
  type World,
  type Setup,
  type Guess,
  type Outcome,
} from "./model";
export function useOcean() {
  const live = useRef(createWorld()),
    history = useRef<World[]>([snapshot(live.current)]);
  const [frame, setFrame] = useState(live.current),
    [playing, setPlaying] = useState(false),
    [replay, setReplay] = useState<number | null>(null),
    [speed, setSpeed] = useState(1);
  const replayRef = useRef<number | null>(null),
    speedRef = useRef(speed);
  speedRef.current = speed;
  useEffect(() => {
    if (!playing) return;
    let id = 0,
      last = 0,
      acc = 0;
    const animate = (now: number) => {
      if (last) acc += Math.min(0.15, (now - last) / 1000);
      last = now;
      while (acc >= STEP) {
        acc -= STEP;
        if (replayRef.current !== null) {
          replayRef.current = Math.min(
            live.current.time,
            replayRef.current + STEP * speedRef.current,
          );
          const selected = history.current.reduce(
            (last, w) => (w.time <= replayRef.current! ? w : last),
            history.current[0],
          );
          setFrame(selected);
          setReplay(replayRef.current);
          if (replayRef.current >= live.current.time) {
            setPlaying(false);
            break;
          }
        } else {
          live.current = tick(live.current);
          if (
            Math.floor(live.current.time * 10) >
            Math.floor(history.current.at(-1)!.time * 10)
          )
            history.current.push(snapshot(live.current));
          setFrame(live.current);
          if (live.current.outcome) {
            history.current.push(snapshot(live.current));
            setPlaying(false);
            break;
          }
        }
      }
      id = requestAnimationFrame(animate);
    };
    id = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(id);
  }, [playing]);
  function launch(
    setup: Setup,
    aim: number,
    mode: World["mode"],
    seed: number,
  ) {
    live.current = createWorld(setup, aim, mode, seed);
    history.current = [snapshot(live.current)];
    replayRef.current = null;
    setReplay(null);
    setFrame(live.current);
    setSpeed(1);
    setPlaying(true);
  }
  function change(setup: Setup) {
    if (live.current.outcome || replayRef.current !== null) return;
    live.current = {
      ...live.current,
      setup: { ...setup },
      reserve: rigModel(setup).reserve,
    };
    setFrame(live.current);
  }
  function scatter(aim: number) {
    live.current = feed(live.current, aim);
    setFrame(live.current);
  }
  function finish(action: Outcome["action"], guess?: Guess) {
    live.current = decide(live.current, action, guess);
    history.current.push(snapshot(live.current));
    setFrame(live.current);
    setPlaying(false);
  }
  function seek(t: number) {
    setPlaying(false);
    replayRef.current = t;
    setReplay(t);
    const selected = history.current.reduce(
      (last, w) => (w.time <= t ? w : last),
      history.current[0],
    );
    setFrame(selected);
  }
  function replayAll() {
    replayRef.current = 0;
    setReplay(0);
    setFrame(history.current[0]);
    setSpeed(0.5);
    setPlaying(true);
  }
  function resume() {
    replayRef.current = null;
    setReplay(null);
    setFrame(live.current);
    if (!live.current.outcome && live.current.time < ROUND_LENGTH)
      setPlaying(true);
  }
  return {
    frame,
    playing,
    setPlaying,
    replay,
    speed,
    setSpeed,
    launch,
    change,
    scatter,
    finish,
    seek,
    replayAll,
    resume,
    live: live.current,
    history: history.current,
  };
}
