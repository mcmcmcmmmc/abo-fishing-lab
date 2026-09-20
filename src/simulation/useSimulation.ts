import { useEffect, useRef, useState } from "react";
import type { Parameters } from "../physics/simulationConfig";
import { CONFIG } from "../physics/simulationConfig";
import { FixedClock, initialFrame, step } from "./engine";
export function useSimulation(params: Parameters) {
  const [frame, setFrame] = useState(initialFrame);
  const [playing, setPlaying] = useState(true);
  const current = useRef(frame),
    parameters = useRef(params);
  parameters.current = params;
  useEffect(() => {
    if (!playing) return;
    const clock = new FixedClock();
    let last = 0,
      id = 0;
    const run = (now: number) => {
      if (last)
        clock.advance((now - last) / 1000, () => {
          if (current.current.time < CONFIG.duration)
            current.current = step(current.current, parameters.current);
        });
      last = now;
      setFrame(current.current);
      if (current.current.time >= CONFIG.duration) {
        setPlaying(false);
        return;
      }
      id = requestAnimationFrame(run);
    };
    id = requestAnimationFrame(run);
    return () => cancelAnimationFrame(id);
  }, [playing]);
  const reset = () => {
    current.current = initialFrame();
    setFrame(current.current);
    setPlaying(true);
  };
  return { frame, playing, setPlaying, reset };
}
