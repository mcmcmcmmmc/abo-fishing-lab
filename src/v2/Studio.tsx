import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Eye,
  EyeOff,
  Fish,
  HelpCircle,
  Pause,
  Play,
  RotateCcw,
  Waves,
  Wind,
  X,
} from "lucide-react";
import { Ocean } from "./Ocean";
import type { Part } from "./draw";
import { useOcean } from "./useOcean";
import {
  CAUSE_LABEL,
  DEFAULT_SETUP,
  rigModel,
  type Guess,
  type Setup,
  type World,
} from "./model";

const parts: Record<Part, { name: string; note: string; experiment: string }> =
  {
    float: {
      name: "阿波 · 水面的翻译器",
      note: "鱼在水下做的动作，经过钓线传递，才变成你看见的漂相。浪、风与触底也能让它动。",
      experiment:
        "试试加重咬铅：漂露出水面的部分会变少，超过承载量后会自行下沉。",
    },
    shot: {
      name: "咬铅 · 控制下沉与姿态",
      note: "它把钩饵带向目标水层，也帮助钓组抵抗水流。加重会更快到位，但会占用阿波的剩余浮力。",
      experiment: "保持水流不变，拖动咬铅滑杆，观察钩饵的下沉速度和横向偏移。",
    },
    hook: {
      name: "钩饵 · 判断的起点",
      note: "钓棚是设定的线长，钩饵的实际深度还受水流与倾斜影响。鱼吸饵的瞬间，水面不一定立刻有信号。",
      experiment: "打开垂直参考线，比较设定的钓棚与钩饵真正到达的位置。",
    },
  };
const guesses: { value: Guess; label: string; icon: typeof Fish }[] = [
  { value: "fish", label: "鱼在带饵", icon: Fish },
  { value: "wave", label: "浪涌起伏", icon: Waves },
  { value: "wind", label: "风压主线", icon: Wind },
  { value: "bottom", label: "钩饵触底", icon: ArrowLeft },
  { value: "unsure", label: "证据还不够", icon: HelpCircle },
];
function guidance(w: World) {
  if (w.reserve < 0)
    return {
      title: "阿波自己沉了。",
      text: "配重超过了承载量。减轻咬铅，再观察漂露出水面的变化。",
    };
  if (w.bottom)
    return {
      title: "钩饵已经碰到底了。",
      text: "先卸重，再被水流拉紧。缩短钓棚，看看这段漂相是否消失。",
    };
  if (w.fish.phase === "carry")
    return {
      title: w.signalStarted
        ? "现在，牵引传到水面了。"
        : "鱼在带饵，漂还没告诉你。",
      text: w.signalStarted
        ? "子线绷紧，阿波持续向侧下方走。这是一段连续证据。"
        : "观察子线从松弛到绷紧的过程，别只盯着鱼嘴。",
    };
  if (w.fish.phase === "bite" || w.fish.phase === "inspect")
    return {
      title: "鱼靠近，不等于可以扬竿。",
      text: "看它试探、含饵、转身。这几个动作在水面上并不同时发生。",
    };
  if (w.fish.phase === "approach")
    return {
      title: "鱼开始靠近钩饵。",
      text: "把目光从鱼移到子线，再移到阿波。哪一个先动？",
    };
  if (w.fish.phase === "escape")
    return {
      title: "鱼已吐饵离开。",
      text: "持续牵引消失，漂恢复姿态。结束观察，回看刚才错过的时间窗口。",
    };
  return {
    title: w.time < 4 ? "先看钩饵怎样到达水层。" : "让诱饵与钩饵相遇。",
    text:
      w.time < 4
        ? "阿波停在水面，钩饵继续下沉。水流会把整套钓组带向右侧。"
        : "点击海面选一个撒饵点，再撒一把。诱饵会边下沉边随流移动。",
  };
}
function Slider({
  label,
  value,
  unit,
  min,
  max,
  step,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  onChange: (n: number) => void;
  disabled: boolean;
}) {
  return (
    <label className="parameter">
      <span>
        {label}
        <strong>
          {value.toFixed(step < 0.1 ? 2 : 1)} <small>{unit}</small>
        </strong>
      </span>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
export function Studio() {
  const ocean = useOcean();
  const [mode, setMode] = useState<World["mode"]>("explore");
  const [started, setStarted] = useState(false);
  const [setup, setSetup] = useState<Setup>({ ...DEFAULT_SETUP });
  const [aim, setAim] = useState(18);
  const [xray, setXray] = useState(true);
  const [reference, setReference] = useState(false);
  const [selected, setSelected] = useState<Part | null>(null);
  const [guess, setGuess] = useState<Guess | undefined>();
  const [round, setRound] = useState(0);
  const [advanced, setAdvanced] = useState(false);
  const [about, setAbout] = useState(false);
  const result = ocean.live.outcome;
  const revealed = mode === "explore" || !!result;
  const seeUnderwater = revealed && (mode === "challenge" || xray);
  const replaying = ocean.replay !== null;
  const locked = mode === "challenge" || !!result || replaying;
  const body = rigModel(ocean.frame.setup);
  const coach = guidance(ocean.frame);
  function launch(nextMode = mode) {
    const seed = round + Math.floor(Math.random() * 4);
    setStarted(true);
    setRound(round + 1);
    setGuess(undefined);
    setSelected(null);
    ocean.launch(setup, aim, nextMode, seed);
  }
  function changeMode(next: World["mode"]) {
    setMode(next);
    launch(next);
  }
  function change(key: keyof Setup, value: number) {
    const next = { ...setup, [key]: value };
    setSetup(next);
    ocean.change(next);
  }
  function reset() {
    setSetup({ ...DEFAULT_SETUP });
    ocean.change({ ...DEFAULT_SETUP });
  }
  function finish(action: "strike" | "wait") {
    ocean.finish(action, guess);
  }
  const paused = !ocean.playing;
  return (
    <div className={`studio ${mode}`}>
      <header className="topbar">
        <a className="brand" href="./" aria-label="潮间训练场">
          <span className="brand-symbol">◒</span>
          <span>
            潮间<span className="brand-en">TIDE LAB / 02</span>
          </span>
        </a>
        <div className="topbar-note">理解水下，才读得懂水面。</div>
        <button className="text-button" onClick={() => setAbout(true)}>
          <HelpCircle size={16} />
          <span>这是什么</span>
        </button>
      </header>

      <main>
        <section className="intro">
          <div>
            <div className="eyebrow">阿波钓法 · 可视化训练场</div>
            <h1>看穿海面。</h1>
            <p>一颗漂的变化，从水下找答案。</p>
          </div>
          <div className="mode-switch" role="group" aria-label="训练模式">
            <button
              className={mode === "explore" ? "active" : ""}
              onClick={() => changeMode("explore")}
            >
              <Eye size={17} />
              <span>
                自由探索<small>看见动作与原因</small>
              </span>
            </button>
            <button
              className={mode === "challenge" ? "active" : ""}
              onClick={() => changeMode("challenge")}
            >
              <Waves size={18} />
              <span>
                只看漂，试判断<small>作答后揭晓水下</small>
              </span>
            </button>
          </div>
        </section>

        <section className="workspace" aria-label="交互海域">
          <div className="scene-wrap">
            <div className="scene-toolbar">
              <span className="live-indicator">
                <i className={paused ? "paused" : ""} />
                {replaying
                  ? "本次回放"
                  : result
                    ? "本次观察结束"
                    : paused
                      ? "观察已暂停"
                      : "海边 · 岩礁外缘"}
              </span>
              <div>
                {revealed && (
                  <button
                    className={
                      seeUnderwater ? "scene-toggle active" : "scene-toggle"
                    }
                    disabled={mode === "challenge"}
                    onClick={() => setXray(!xray)}
                  >
                    {seeUnderwater ? <Eye size={16} /> : <EyeOff size={16} />}{" "}
                    {mode === "challenge" ? "水下已揭晓" : "看穿海面"}
                  </button>
                )}
                {!revealed && (
                  <span className="sealed">
                    <EyeOff size={14} /> 水下暂时隐藏
                  </span>
                )}
              </div>
            </div>
            <Ocean
              world={ocean.frame}
              xray={seeUnderwater}
              aim={aim}
              onAim={setAim}
              reference={reference && revealed}
              selected={revealed ? selected : null}
              onSelect={(p) => revealed && setSelected(p)}
            />
            <div className="scene-caption">
              {mode === "explore"
                ? "点击海面选择落点 · 点击钓组查看作用"
                : result
                  ? "拖动下方时间轴，检查你的判断"
                  : "留意漂与浪的相对运动，以及主线先后变化"}
            </div>
            {!started && (
              <div className="start-invitation">
                <span className="eyebrow">海面以下，正在发生什么？</span>
                <h2>抛出你的第一竿。</h2>
                <p>
                  选一个落点，亲手改变眼前的钓组。
                  <br />
                  看见鱼吃饵与漂动之间的那段时间。
                </p>
                <button className="primary-button" onClick={() => launch()}>
                  抛竿，开始观察 <ArrowRight size={17} />
                </button>
              </div>
            )}
            {selected && revealed && (
              <aside className="part-popover">
                <button
                  className="close-button"
                  aria-label="关闭钓组说明"
                  onClick={() => setSelected(null)}
                >
                  <X size={17} />
                </button>
                <span className="eyebrow">眼前的钓组</span>
                <h3>{parts[selected].name}</h3>
                <p>{parts[selected].note}</p>
                <p className="experiment">{parts[selected].experiment}</p>
              </aside>
            )}
            <div className="scene-bottom">
              <button
                className="round-button"
                aria-label={paused ? "继续播放" : "暂停观察"}
                disabled={!started || (!!result && !replaying)}
                onClick={() => ocean.setPlaying(!ocean.playing)}
              >
                {paused ? (
                  <Play size={17} fill="currentColor" />
                ) : (
                  <Pause size={17} fill="currentColor" />
                )}
              </button>
              <span className="timecode">
                {ocean.frame.time.toFixed(1).padStart(4, "0")}{" "}
                <small>
                  / {result ? ocean.live.time.toFixed(1) : "32.0"} s
                </small>
              </span>
              {revealed && (
                <label className="reference-toggle">
                  <input
                    type="checkbox"
                    checked={reference}
                    onChange={(e) => setReference(e.target.checked)}
                  />{" "}
                  垂直参考
                </label>
              )}
              <span className="scene-scale">横向 42 m · 深度 8 m</span>
            </div>
          </div>

          <aside className="field-notes">
            <div className="notes-heading">
              <span className="eyebrow">
                {result
                  ? "AFTER THE CAST"
                  : mode === "challenge"
                    ? "READ THE WATER"
                    : "LEARN BY DOING"}
              </span>
              <span className="note-number">{result ? "↺" : "01—03"}</span>
            </div>
            {result ? (
              <>
                <div className="outcome-label">
                  本次复盘 ·{" "}
                  {result.action === "strike"
                    ? "你选择扬竿"
                    : result.action === "wait"
                      ? "你选择等待"
                      : "观察时间结束"}
                </div>
                <h2>{result.title}</h2>
                <p className="coach-copy">{result.reason}</p>
                <div className="result-facts">
                  <span>
                    水下证据<strong>{result.actual}</strong>
                  </span>
                  {result.guess && (
                    <span>
                      你的推断
                      <strong>
                        {result.guess === "unsure"
                          ? "证据还不够"
                          : CAUSE_LABEL[result.guess]}
                      </strong>
                    </span>
                  )}
                </div>
                {mode === "challenge" && (
                  <p className="revealed-setup">
                    本局参数：咬铅 {ocean.live.setup.shot.toFixed(1)} g · 钓棚{" "}
                    {ocean.live.setup.depth.toFixed(1)} m · 阿波承载{" "}
                    {ocean.live.setup.capacity.toFixed(1)} g<br />
                    基础流速 {ocean.live.setup.flow.toFixed(2)} m/s · 风速{" "}
                    {ocean.live.setup.wind.toFixed(1)} m/s · 浪高参数{" "}
                    {ocean.live.setup.wave.toFixed(2)} m
                  </p>
                )}
                <button
                  className="secondary-button full"
                  onClick={ocean.replayAll}
                >
                  <RotateCcw size={16} /> 慢放这一次 · 0.5×
                </button>
                <div className="event-list" aria-label="本次事件记录">
                  {ocean.live.events
                    .filter((e) => e.type !== "action")
                    .slice(-5)
                    .map((e, i) => (
                      <button
                        key={`${e.time}-${i}`}
                        onClick={() => ocean.seek(Math.max(0, e.time - 1))}
                      >
                        <time>{e.time.toFixed(1)}s</time>
                        <span>{e.label}</span>
                      </button>
                    ))}
                </div>
                <button
                  className="primary-button full"
                  onClick={() => launch()}
                >
                  再抛一次 <ArrowRight size={17} />
                </button>
              </>
            ) : mode === "explore" ? (
              <>
                <h2>
                  别急着扬竿。
                  <br />
                  先看看下面。
                </h2>
                <p className="notes-lead">
                  你调的每一个参数，都在这片海里发生。
                </p>
                <ol className="learning-steps">
                  <li>
                    <span>01</span>
                    <div>
                      <strong>让钓组到位</strong>
                      <p>调咬铅与钓棚，看速度、深度和倾斜。</p>
                    </div>
                  </li>
                  <li>
                    <span>02</span>
                    <div>
                      <strong>让饵与鱼相遇</strong>
                      <p>在海面选点撒饵，看它怎样随流下沉。</p>
                    </div>
                  </li>
                  <li>
                    <span>03</span>
                    <div>
                      <strong>连接水下与水面</strong>
                      <p>观察含饵、绷线、漂动之间的先后。</p>
                    </div>
                  </li>
                </ol>
                <div className="coach">
                  <span className="coach-tag">
                    <i /> 此刻，试着留意
                  </span>
                  <h3>{coach.title}</h3>
                  <p>{coach.text}</p>
                </div>
                <button
                  className="text-button challenge-link"
                  onClick={() => changeMode("challenge")}
                >
                  准备好了？关掉透视试一次 <ArrowRight size={16} />
                </button>
              </>
            ) : (
              <>
                <h2>
                  这一次，
                  <br />
                  只相信证据。
                </h2>
                <p className="notes-lead">
                  同样的漂动，可能来自不同原因。观察一段过程，再做选择。
                </p>
                <div className="challenge-instruction">
                  <span>观察提示</span>
                  <p>
                    漂是跟着浪恢复原位，还是持续走向同一方向？先动的是水面主线，还是阿波？
                  </p>
                </div>
                <fieldset className="guess-options">
                  <legend>你认为最可能是什么？</legend>
                  {guesses.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={guess === value}
                      className={guess === value ? "selected" : ""}
                      onClick={() => setGuess(value)}
                    >
                      <Icon size={16} />
                      {label}
                      <span>{guess === value ? "●" : "○"}</span>
                    </button>
                  ))}
                </fieldset>
                <p className="quiet-note">
                  选好原因后，在下方选择扬竿或等待。你会看到这一次实际发生的水下过程。
                </p>
              </>
            )}
          </aside>
        </section>

        <section className="cockpit" aria-label="钓组和操作">
          {result ? (
            <div className="replay-bar">
              <span>
                <RotateCcw size={17} /> 本次时间轴
              </span>
              <input
                type="range"
                aria-label="回放时间"
                min="0"
                max={ocean.live.time}
                step="0.1"
                value={replaying ? ocean.replay! : ocean.live.time}
                onChange={(e) => ocean.seek(Number(e.target.value))}
              />
              <strong>{ocean.frame.time.toFixed(1)} s</strong>
              <button className="text-button" onClick={ocean.replayAll}>
                从头慢放
              </button>
            </div>
          ) : (
            <>
              <div className="parameter-row">
                <div className="parameter-intro">
                  <span className="eyebrow">
                    {mode === "challenge" ? "本次钓组" : "亲手调一调"}
                  </span>
                  <strong>
                    {mode === "challenge" ? "先看漂，再揭晓" : "改变一个条件"}
                  </strong>
                </div>
                {mode === "explore" ? (
                  <>
                    <Slider
                      label="咬铅重量"
                      value={setup.shot}
                      unit="g"
                      min={0.1}
                      max={2.4}
                      step={0.1}
                      onChange={(n) => change("shot", n)}
                      disabled={locked}
                    />
                    <Slider
                      label="设定钓棚"
                      value={setup.depth}
                      unit="m"
                      min={1}
                      max={7}
                      step={0.1}
                      onChange={(n) => change("depth", n)}
                      disabled={locked}
                    />
                    <Slider
                      label="水流速度"
                      value={setup.flow}
                      unit="m/s"
                      min={0}
                      max={1}
                      step={0.05}
                      onChange={(n) => change("flow", n)}
                      disabled={locked}
                    />
                  </>
                ) : (
                  <p className="challenge-setup">
                    这一局的环境和钓组已设置好。
                    <br />
                    完成判断后，完整参数与水下轨迹一起揭晓。
                  </p>
                )}
                {mode === "explore" && (
                  <button
                    className="more-button"
                    aria-expanded={advanced}
                    onClick={() => setAdvanced(!advanced)}
                  >
                    更多条件 <ChevronDown size={15} />
                  </button>
                )}
              </div>
              {advanced && mode === "explore" && (
                <div className="advanced-row">
                  <Slider
                    label="风速"
                    value={setup.wind}
                    unit="m/s"
                    min={0}
                    max={8}
                    step={0.5}
                    onChange={(n) => change("wind", n)}
                    disabled={locked}
                  />
                  <Slider
                    label="浪高参数"
                    value={setup.wave}
                    unit="m"
                    min={0}
                    max={0.8}
                    step={0.05}
                    onChange={(n) => change("wave", n)}
                    disabled={locked}
                  />
                  <Slider
                    label="阿波承载量"
                    value={setup.capacity}
                    unit="g"
                    min={0.8}
                    max={3}
                    step={0.1}
                    onChange={(n) => change("capacity", n)}
                    disabled={locked}
                  />
                  <button
                    className="text-button"
                    onClick={reset}
                    disabled={locked}
                  >
                    恢复默认
                  </button>
                </div>
              )}
              <div className="action-row">
                <div className="cast-actions">
                  <button className="secondary-button" onClick={() => launch()}>
                    <RotateCcw size={16} />
                    重新抛竿
                  </button>
                  {mode === "explore" && (
                    <button
                      className="secondary-button feed-button"
                      disabled={replaying || paused}
                      onClick={() => ocean.scatter(aim)}
                    >
                      <span className="grain-icon">⁙</span> 撒一把诱饵{" "}
                      <small>{aim.toFixed(0)} m</small>
                    </button>
                  )}
                </div>
                <div className="decision-actions">
                  <button
                    className="text-button"
                    disabled={!started || (mode === "challenge" && !guess)}
                    onClick={() => finish("wait")}
                  >
                    选择等待 · 看复盘
                  </button>
                  <button
                    className="primary-button"
                    disabled={
                      ocean.frame.time < 2 || (mode === "challenge" && !guess)
                    }
                    onClick={() => finish("strike")}
                  >
                    扬竿 <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

        <section className="readouts" aria-label="当前观察数据">
          {revealed ? (
            <>
              <div>
                <span>实际钩饵深度</span>
                <strong>
                  {Math.max(0, ocean.frame.hook.depth).toFixed(2)}
                  <small>m</small>
                </strong>
              </div>
              <div>
                <span>设定钓棚</span>
                <strong>
                  {ocean.frame.setup.depth.toFixed(1)}
                  <small>m</small>
                </strong>
              </div>
              <div className={body.reserve < 0 ? "warning" : ""}>
                <span>剩余承载量</span>
                <strong>
                  {body.reserve.toFixed(2)}
                  <small>g</small>
                </strong>
              </div>
              <p>
                线长 ≠ 深度。漂动 ≠ 吃口。
                <br />
                <span>让眼前这一次过程，成为判断的依据。</span>
              </p>
            </>
          ) : (
            <p className="hidden-readout">
              <EyeOff size={18} />{" "}
              水下数据会在你完成判断后解锁。现在，专注水面。
            </p>
          )}
        </section>
        <footer>
          <span>
            潮间 TIDE LAB <i>·</i> 每一漂，都有来处。
          </span>
          <button className="text-button" onClick={() => setAbout(true)}>
            教学模型与边界
          </button>
          <a href="../">
            打开第一版 <ArrowRight size={13} />
          </a>
        </footer>
      </main>
      {about && (
        <div className="modal-backdrop" onClick={() => setAbout(false)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="about-title"
            className="about-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-button"
              aria-label="关闭介绍"
              onClick={() => setAbout(false)}
            >
              <X size={20} />
            </button>
            <span className="eyebrow">关于这个训练场</span>
            <h2 id="about-title">
              把看不见的因果，
              <br />
              变成可以亲手验证的过程。
            </h2>
            <p>
              这里模拟的是一套简化的阿波钓组。你改变配重、线长和环境，钩饵、诱饵、鱼与漂会在同一个时间进程中运动。回放使用本次记录，而非预制动画。
            </p>
            <p>
              探索模式帮助理解；盲判模式让你先根据水面推断，再打开水下证据。每轮最多
              32 秒，结束后可以逐段复盘。
            </p>
            <p className="model-disclosure">
              模型边界：下沉、流动与信号传递采用教学近似；鱼的接近和含饵是规则模型。这里不是水动力求解器，数值不代表真实钓场预测，也不能作为装备承载或中鱼率保证。
            </p>
            <button className="primary-button" onClick={() => setAbout(false)}>
              去海边试试 <ArrowRight size={17} />
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
