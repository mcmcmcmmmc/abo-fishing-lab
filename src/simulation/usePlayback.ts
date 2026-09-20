import { useEffect, useRef, useState } from "react";
import { CONFIG } from "../physics/simulationConfig";
import { FixedClock } from "./engine";
export function usePlayback(autoPlay = false) {
  const [time, setTime] = useState(0),
    [playing, setPlaying] = useState(autoPlay),
    [speed, setSpeed] = useState(1);
  const current = useRef(0);
  useEffect(() => {
    if (!playing) return;
    let id = 0,
      last = 0;
    const clock = new FixedClock();
    const run = (now: number) => {
      if (last)
        clock.advance(
          (now - last) / 1000,
          () =>
            (current.current = Math.min(
              CONFIG.signalDuration,
              current.current + CONFIG.timestep * speed,
            )),
        );
      last = now;
      setTime(current.current);
      if (current.current >= CONFIG.signalDuration) {
        setPlaying(false);
        return;
      }
      id = requestAnimationFrame(run);
    };
    id = requestAnimationFrame(run);
    return () => cancelAnimationFrame(id);
  }, [playing, speed]);
  const seek = (t: number) => {
    current.current = Math.max(0, Math.min(CONFIG.signalDuration, t));
    setTime(current.current);
  };
  const restart = () => {
    seek(0);
    setPlaying(true);
  };
  return { time, playing, speed, setSpeed, setPlaying, seek, restart };
}
