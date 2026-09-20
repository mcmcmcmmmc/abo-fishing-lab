import { useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  Eye,
  MousePointer2,
  Play,
  RotateCcw,
} from "lucide-react";
import { CAUSES } from "../data/signals";
import {
  chooseCase,
  evaluate,
  type Answer,
  type Action,
} from "../training/evaluate";
import { usePlayback } from "../simulation/usePlayback";
import { SignalPlayer } from "./SignalPlayer";
export function Training({
  onFinish,
}: {
  onFinish: (identified: boolean | null, action: boolean) => void;
}) {
  const [sample, setSample] = useState(() => chooseCase()),
    [amplitude, setAmplitude] = useState(() => 0.85 + Math.random() * 0.3),
    [answer, setAnswer] = useState<Answer | null>(null),
    [action, setAction] = useState<Action | null>(null),
    [submitted, setSubmitted] = useState(false),
    [started, setStarted] = useState(false),
    [seen, setSeen] = useState(false),
    [round, setRound] = useState(1);
  const player = usePlayback(false);
  useEffect(() => {
    if (player.time >= 7.99) setSeen(true);
  }, [player.time]);
  const feedback =
    submitted && answer && action ? evaluate(sample, answer, action) : null;
  const submit = () => {
    if (!answer || !action || !seen || submitted) return;
    const result = evaluate(sample, answer, action);
    setSubmitted(true);
    onFinish(result.identified, result.actionCorrect);
    player.setSpeed(0.5);
    player.restart();
  };
  const next = () => {
    setSample(chooseCase(sample.id));
    setAmplitude(0.85 + Math.random() * 0.3);
    setAnswer(null);
    setAction(null);
    setSubmitted(false);
    setStarted(false);
    setSeen(false);
    setRound((n) => n + 1);
    player.seek(0);
    player.setSpeed(1);
    player.setPlaying(false);
  };
  return (
    <div className="training-layout">
      <div>
        <div className="training-round">
          <span className="eyebrow">
            OBSERVATION CHALLENGE / {String(round).padStart(2, "0")}
          </span>
          <span className="badge">先观察，再下结论</span>
        </div>
        <div className="training-scene">
          <SignalPlayer
            sample={sample}
            player={player}
            reveal={submitted}
            training
            amplitude={amplitude}
          />
          {!started && (
            <div className="training-start">
              <Eye size={30} />
              <h2>水下发生了什么？</h2>
              <p>
                观察 8 秒漂相，记录节奏、方向与持续性。
                <br />
                做出判断后，再揭开水下真相。
              </p>
              <button
                className="button primary"
                onClick={() => {
                  setStarted(true);
                  player.restart();
                }}
              >
                <Play size={14} />
                开始观察
              </button>
            </div>
          )}
        </div>
        {feedback && (
          <section className="card feedback" aria-live="polite">
            <span className="eyebrow">CAUSAL REVIEW / 因果复盘</span>
            <h2>{feedback.title}</h2>
            <div className="answer-summary">
              <span>
                你的判断：
                {answer === "uncertain"
                  ? "信息不足"
                  : CAUSES.find((c) => c.id === answer)?.label}{" "}
                · {action === "strike" ? "扬竿" : "等待"}
              </span>
              <strong>本片段：{sample.name}</strong>
            </div>
            <ol>
              <li>
                <strong>观察</strong>
                <p>{sample.observation}</p>
              </li>
              <li>
                <strong>候选解释</strong>
                <p>{sample.candidates}</p>
              </li>
              <li>
                <strong>区分线索</strong>
                <p>{sample.clue}</p>
              </li>
              <li>
                <strong>真相与行动</strong>
                <p>
                  {sample.truth} {feedback.actionExplanation}
                </p>
              </li>
            </ol>
            <button className="button primary" onClick={next}>
              下一次观察 <ArrowRight size={15} />
            </button>
          </section>
        )}
        {!feedback && (
          <div className="insight" style={{ marginTop: 20 }}>
            <Eye size={19} />
            <div>
              <h3>“阿波下沉”只是观察，还不是结论。</h3>
              <p>
                留意是否持续、是否与浪同步、是否横向位移，以及原有漂流速度是否改变。信息不足也可以选择等待。
              </p>
            </div>
          </div>
        )}
      </div>
      <section className="card training-answers">
        <div className="panel-title">
          <MousePointer2 size={16} />
          <h3>你的判断</h3>
        </div>
        <div className="answer-body">
          <span className="question-number">01 / 发生了什么？</span>
          <div className="answer-options">
            {[
              ...CAUSES,
              { id: "uncertain" as const, label: "信息不足，保留判断" },
            ].map((c, i) => (
              <button
                disabled={!seen || submitted}
                key={c.id}
                className={answer === c.id ? "selected" : ""}
                aria-pressed={answer === c.id}
                onClick={() => setAnswer(c.id)}
              >
                <span>{String.fromCharCode(65 + i)}</span>
                {c.label}
                {answer === c.id && <Check size={13} />}
              </button>
            ))}
          </div>
          <span className="question-number">02 / 接下来做什么？</span>
          <div className="action-options">
            <button
              disabled={!seen || submitted}
              className={action === "strike" ? "selected" : ""}
              aria-pressed={action === "strike"}
              onClick={() => setAction("strike")}
            >
              ↗ 扬竿
            </button>
            <button
              disabled={!seen || submitted}
              className={action === "wait" ? "selected" : ""}
              aria-pressed={action === "wait"}
              onClick={() => setAction("wait")}
            >
              ◷ 等待
            </button>
          </div>
          <button
            className="button primary full"
            disabled={!answer || !action || !seen || submitted}
            onClick={submit}
          >
            提交判断，查看水下真相
          </button>
          <p className="note">
            {submitted
              ? "结果已记录。可拖动回放时间轴核对因果。"
              : !seen
                ? "完整观察后解锁判断。你可以重播，不需要抢反应。"
                : "先形成假设，再决定动作。片段不提供足够证据时，可以保留判断。"}
          </p>
          <button
            className="text-button"
            onClick={() => {
              player.restart();
              setStarted(true);
            }}
          >
            <RotateCcw size={13} />
            再观察一次
          </button>
        </div>
      </section>
    </div>
  );
}
