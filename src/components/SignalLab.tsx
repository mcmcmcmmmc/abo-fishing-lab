import { useState } from "react";
import { ChevronRight, ArrowRight } from "lucide-react";
import { SIGNALS } from "../data/signals";
import { usePlayback } from "../simulation/usePlayback";
import { SignalPlayer } from "./SignalPlayer";
export function SignalLab({
  onLearn,
  onTrain,
}: {
  onLearn: () => void;
  onTrain: () => void;
}) {
  const [id, setId] = useState("fast"),
    [reveal, setReveal] = useState(false);
  const sample = SIGNALS.find((s) => s.id === id)!,
    player = usePlayback(true);
  return (
    <>
      <div className="signal-layout">
        <aside className="card signal-library">
          <div className="panel-title">
            <h3>漂相样本库</h3>
            <span>15 个片段</span>
          </div>
          {(["fish", "environment"] as const).map((kind) => (
            <div className="signal-group" key={kind}>
              <label>
                {kind === "fish" ? "真鱼讯 · 6" : "环境 / 非目标吃口 · 9"}
              </label>
              {SIGNALS.filter((s) => s.kind === kind).map((s) => (
                <button
                  key={s.id}
                  className={id === s.id ? "selected" : ""}
                  onClick={() => {
                    setId(s.id);
                    setReveal(false);
                    player.restart();
                  }}
                >
                  <span
                    className={
                      "signal-mini " + (s.kind === "fish" ? "fish-dot" : "")
                    }
                  />
                  {s.name}
                  <ChevronRight size={13} />
                </button>
              ))}
            </div>
          ))}
        </aside>
        <div>
          <SignalPlayer
            sample={sample}
            player={player}
            reveal={reveal}
            onReveal={() => {
              setReveal(!reveal);
              onLearn();
              if (!reveal) {
                player.setSpeed(0.5);
                player.restart();
              }
            }}
          />
          <section className="card signal-explanation">
            <span className="eyebrow">OBSERVE → HYPOTHESIZE → VERIFY</span>
            <h2>{sample.name}</h2>
            <div className="reason-grid">
              <div>
                <label>01 你看到了什么</label>
                <p>{sample.observation}</p>
              </div>
              <div>
                <label>02 有哪些候选解释</label>
                <p>{sample.candidates}</p>
              </div>
              <div>
                <label>03 用什么线索区分</label>
                <p>{sample.clue}</p>
              </div>
              {reveal && (
                <div>
                  <label>04 本片段的水下真相</label>
                  <p>{sample.truth}</p>
                </div>
              )}
            </div>
            <button className="button primary" onClick={onTrain}>
              不看答案，试着判断 <ArrowRight size={15} />
            </button>
          </section>
        </div>
      </div>
      <p className="model-note">
        片段展示一种可能因果，不是“漂相 →
        原因”的唯一映射。鱼讯和非鱼讯会相似，真实判断还需控线记录、浪相与地形信息。
      </p>
    </>
  );
}
