import { Play, Pause, RotateCcw, Eye, EyeOff } from "lucide-react";
import type { SignalCase } from "../data/signals";
import {
  SIGNAL_PARAMS,
  sampleSignal,
  signalFrame,
  currentEvent,
} from "../simulation/signals";
import { usePlayback } from "../simulation/usePlayback";
import { SurfaceView, UnderwaterView } from "./SeaViews";
export type Playback = ReturnType<typeof usePlayback>;
export function SignalPlayer({
  sample,
  player,
  reveal,
  onReveal,
  training = false,
  amplitude = 1,
}: {
  sample: SignalCase;
  player: Playback;
  reveal: boolean;
  onReveal?: () => void;
  training?: boolean;
  amplitude?: number;
}) {
  const signal = sampleSignal(sample, player.time, amplitude),
    frame = signalFrame(player.time, sample);
  return (
    <section className="card signal-player">
      <div className="view-toolbar">
        <span className="live-label">
          <i />
          {training && !reveal ? "盲看模式 · 水下隐藏" : "教学片段 · 合成信号"}
        </span>
        <span className="mono">{player.time.toFixed(1)} / 8.0 s</span>
        {onReveal && (
          <button className="text-button" onClick={onReveal}>
            {reveal ? <EyeOff size={15} /> : <Eye size={15} />}{" "}
            {reveal ? "隐藏水下" : "查看水下真相"}
          </button>
        )}
      </div>
      <SurfaceView frame={frame} p={SIGNAL_PARAMS} signal={signal} large />
      {reveal && (
        <div className="truth-scene">
          <UnderwaterView frame={frame} p={SIGNAL_PARAMS} signal={signal} />
          <div className="event-caption">
            <span>{player.time.toFixed(1)}s</span>
            {currentEvent(sample, player.time)}
          </div>
        </div>
      )}
      <div className="playback-controls">
        <button
          className="icon-button"
          aria-label={player.playing ? "暂停片段" : "播放片段"}
          onClick={() =>
            player.time >= 8
              ? player.restart()
              : player.setPlaying(!player.playing)
          }
        >
          {player.playing ? <Pause size={15} /> : <Play size={15} />}
        </button>
        <button
          className="icon-button"
          aria-label="重播片段"
          onClick={player.restart}
        >
          <RotateCcw size={14} />
        </button>
        <input
          disabled={training && !reveal}
          type="range"
          min="0"
          max="8"
          step="0.02"
          aria-label="回放时间轴"
          value={player.time}
          onChange={(e) => {
            player.setPlaying(false);
            player.seek(+e.target.value);
          }}
        />
        <select
          aria-label="回放速度"
          value={player.speed}
          onChange={(e) => player.setSpeed(+e.target.value)}
        >
          <option value="1">1× 正常</option>
          <option value="0.5">0.5× 慢放</option>
          <option value="0.25">0.25× 慢放</option>
        </select>
      </div>
      {reveal && (
        <div className="event-timeline">
          {sample.events.map((e) => (
            <button
              key={e.time}
              onClick={() => {
                player.setPlaying(false);
                player.seek(e.time);
              }}
              className={player.time >= e.time ? "past" : ""}
            >
              <span>{e.time.toFixed(1)} s</span>
              <i />
              {e.label}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
