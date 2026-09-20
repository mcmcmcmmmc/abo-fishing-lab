import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ChevronDown,
  Compass,
  Fish,
  Lock,
  Pause,
  Play,
  RotateCcw,
  Settings2,
  Target,
  Waves,
  Wind,
  X,
} from "lucide-react";
import {
  BAITS,
  DEFAULT_TACKLE,
  environment,
  HOOKS,
  SITES,
  SPECIES,
  type SiteId,
  type TimeId,
  type SeaId,
  type Tackle,
  type Vec,
} from "./data";
import { lineStrength, slack } from "./engine";
import { Canvas } from "./Canvas";
import { useField } from "./useField";
const TIMES = { dawn: "晨光", day: "白昼", dusk: "黄昏" };
const SEAS = { calm: "平静", ripple: "微浪", rough: "风浪" };
const formatTime = (n: number) =>
  `${Math.floor(n / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(n % 60)
    .toString()
    .padStart(2, "0")}`;
function HookShape({ size = 2 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 80" aria-hidden="true">
      <g
        transform={`translate(${32 - (10 + size * 4) / 2}, 7) scale(${0.57 + size * 0.12})`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      >
        <ellipse cx="3" cy="4" rx="3" ry="4" />
        <path d="M3 8v42c0 20 31 20 31-1V36l-7 9" />
        <path d="m34 36 4 9" strokeWidth="1.2" />
      </g>
    </svg>
  );
}
function Gear({
  tackle,
  onChange,
}: {
  tackle: Tackle;
  onChange: (t: Tackle) => void;
}) {
  const set = (key: keyof Tackle, n: number | string) =>
    onChange({ ...tackle, [key]: n });
  return (
    <div className="gear-body">
      <div className="hook-config">
        <div className="small-heading">
          <span>01 / 选钩</span>
          <strong>钩门，决定怎样入口</strong>
        </div>
        <div className="hook-choices">
          {HOOKS.map((h) => (
            <button
              key={h.id}
              className={tackle.hook === h.id ? "selected" : ""}
              aria-pressed={tackle.hook === h.id}
              onClick={() => set("hook", h.id)}
            >
              <HookShape size={h.id} />
              <strong>{h.name}</strong>
              <span>{h.gape} mm</span>
            </button>
          ))}
        </div>
        <p>
          小钩更易隐蔽，承力较低；大钩承力较高，也更容易被小口鱼拒绝或卡入结构。这里的号数为本场统一规格。
        </p>
      </div>
      <div className="bait-config">
        <div className="small-heading">
          <span>02 / 钩饵与子线</span>
          <strong>饵体和钩要一起考虑</strong>
        </div>
        <label>
          挂饵
          <select
            aria-label="挂饵"
            value={tackle.bait}
            onChange={(e) => set("bait", e.target.value)}
          >
            {BAITS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} · 饵体 {b.size} mm
              </option>
            ))}
          </select>
        </label>
        <label>
          子线直径
          <select
            aria-label="子线直径"
            value={tackle.line}
            onChange={(e) => set("line", Number(e.target.value))}
          >
            <option value="0.18">0.18 mm · 细线</option>
            <option value="0.22">0.22 mm · 均衡</option>
            <option value="0.28">0.28 mm · 强线</option>
          </select>
        </label>
        <p>鱼可能只啄饵、不含钩。大力扬竿也可能断在被礁石磨过的子线上。</p>
      </div>
      <div className="rig-config">
        <div className="small-heading">
          <span>03 / 设置钓组</span>
          <strong>让饵到你想钓的水层</strong>
        </div>
        {(
          [
            {
              key: "depth",
              label: "钓棚",
              min: 1,
              max: 10,
              step: 0.5,
              unit: "m",
            },
            {
              key: "shot",
              label: "咬铅",
              min: 0.2,
              max: 2.5,
              step: 0.1,
              unit: "g",
            },
            {
              key: "float",
              label: "阿波承载",
              min: 0.8,
              max: 3,
              step: 0.1,
              unit: "g",
            },
          ] as const
        ).map((s) => (
          <label key={s.key} className="gear-range">
            <span>
              {s.label}
              <strong>
                {tackle[s.key].toFixed(1)} <small>{s.unit}</small>
              </strong>
            </span>
            <input
              type="range"
              aria-label={s.label}
              min={s.min}
              max={s.max}
              step={s.step}
              value={tackle[s.key]}
              onChange={(e) => set(s.key, Number(e.target.value))}
            />
          </label>
        ))}
      </div>
    </div>
  );
}
export function Field() {
  const [site, setSite] = useState<SiteId>("harbor"),
    [time, setTime] = useState<TimeId>("dawn"),
    [sea, setSea] = useState<SeaId>("ripple"),
    [tide, setTide] = useState<"flood" | "ebb">("flood");
  const [tackle, setTackle] = useState({ ...DEFAULT_TACKLE }),
    [gear, setGear] = useState(false),
    [about, setAbout] = useState(false),
    [wasPaused, setWasPaused] = useState(false),
    [leaving, setLeaving] = useState(false),
    [aim, setAim] = useState<Vec>({ x: 0, y: 26, z: 0 }),
    [replay, setReplay] = useState<number | null>(null),
    [toast, setToast] = useState("");
  const sim = useField(),
    w = sim.world;
  const previewEnv = useMemo(
    () => environment(site, time, sea, tide, 88177),
    [site, time, sea, tide],
  );
  const selectedSite = SITES.find((s) => s.id === site)!;
  const active = w?.phase === "fishing" || w?.phase === "fight",
    fight = w?.phase === "fight",
    ended = w?.phase === "ended";
  const record = w?.trace.length
    ? w.trace.reduce(
        (last, f) => (f.t <= (replay ?? Infinity) ? f : last),
        w.trace[0],
      )
    : undefined;
  const currentSite = w
    ? SITES.find((s) => s.id === w.env.site)!
    : selectedSite;
  function openManual() {
    setWasPaused(sim.paused);
    sim.setPaused(true);
    setAbout(true);
  }
  function closeManual() {
    setAbout(false);
    sim.setPaused(wasPaused);
  }
  function enter() {
    sim.enter(
      environment(
        site,
        time,
        sea,
        tide,
        Math.floor(Math.random() * 2147483646) + 1,
      ),
      tackle,
    );
    setGear(false);
    setReplay(null);
    setToast("先选落点，再抛竿；也可以提前撒一把诱饵。");
  }
  function cast() {
    sim.cast(aim, tackle);
    setReplay(null);
    setGear(false);
    setToast("钓组已入水。留意右侧漂相，收放主线控制余量。");
  }
  function toggleReel(next: "reel" | "feed") {
    if (!w) return;
    sim.control("reel", w.reel === next ? "neutral" : next);
    setToast(
      next === "reel"
        ? "收线会持续进行，再按一次停止。"
        : "放线会持续进行，再按一次停止。",
    );
  }
  return (
    <div className={`field-app ${w ? "at-sea" : "at-lobby"}`}>
      <header className="field-header">
        <a className="field-brand" href="./">
          <span className="brand-mark">◒</span>
          <strong>
            潮间<small>TIDE LAB / FIELD</small>
          </strong>
        </a>
        <span className="header-center">
          {w ? "一片海，一套钓组，你的判断。" : "沿着水面，寻找水下的答案。"}
        </span>
        <div className="header-links">
          <button onClick={openManual}>实战手册</button>
          {w ? (
            <button
              className="exit-button"
              onClick={() => {
                setWasPaused(sim.paused);
                sim.setPaused(true);
                setLeaving(true);
              }}
            >
              <ArrowLeft size={14} />
              退出重选
            </button>
          ) : (
            <a href="../v2/">
              教学场 <ArrowRight size={13} />
            </a>
          )}
        </div>
      </header>
      {!w ? (
        <main className="lobby">
          <section className="lobby-heading">
            <div className="eyebrow">FIELD NOTES / 真实感实战模拟</div>
            <h1>
              下一竿，
              <br />
              <em>由你判断。</em>
            </h1>
            <p>
              选择一段岸线，读水、配钩、下竿。
              <br />
              鱼不会等你准备好，也不是每次漂动都有答案。
            </p>
            <span className="lobby-index">01 — 选择钓场</span>
          </section>
          <section className="site-grid" aria-label="选择钓场">
            {SITES.map((s, i) => (
              <button
                key={s.id}
                className={`site-card ${site === s.id ? "selected" : ""}`}
                aria-pressed={site === s.id}
                onClick={() => setSite(s.id)}
              >
                <div className="site-preview">
                  <Canvas
                    kind="sea"
                    env={environment(s.id, time, sea, tide, 1)}
                    aim={aim}
                    preview
                  />
                  <span className="site-number">0{i + 1}</span>
                  <span className="site-choice">
                    {site === s.id ? "已选择" : "选择这里"}
                    {site === s.id ? <span>●</span> : <ArrowRight size={14} />}
                  </span>
                </div>
                <div className="site-copy">
                  <span>{s.en}</span>
                  <h2>{s.name}</h2>
                  <p>{s.description}</p>
                  <div className="site-tags">
                    {s.features.map((f) => (
                      <small key={f}>{f}</small>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </section>
          <section className="departure">
            <div className="departure-title">
              <span className="eyebrow">02 — 出发条件</span>
              <strong>这一场，海况保持不变。</strong>
            </div>
            <label>
              时段
              <select
                aria-label="时段"
                value={time}
                onChange={(e) => setTime(e.target.value as TimeId)}
              >
                {Object.entries(TIMES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label>
              海况
              <select
                aria-label="海况"
                value={sea}
                onChange={(e) => setSea(e.target.value as SeaId)}
              >
                {Object.entries(SEAS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label>
              潮向
              <select
                aria-label="潮向"
                value={tide}
                onChange={(e) => setTide(e.target.value as "flood" | "ebb")}
              >
                <option value="flood">涨潮 →</option>
                <option value="ebb">退潮 ←</option>
              </select>
            </label>
            <div className="departure-weather">
              <span>
                <Wind size={14} />
                {previewEnv.wind.toFixed(1)} m/s
              </span>
              <span>
                <Waves size={14} />
                {Math.abs(previewEnv.flow).toFixed(2)} m/s
              </span>
            </div>
            <button className="field-primary enter-button" onClick={enter}>
              进入 {selectedSite.name}
              <ArrowRight size={17} />
            </button>
          </section>
          <div className="lobby-bottom">
            <p>
              <Lock size={13} />
              入场后不能调整环境；更换钓场、时段或海况，需要退出重选。
            </p>
            <button className="field-text" onClick={() => setGear(!gear)}>
              <Settings2 size={15} />
              出发前配钓组 <ChevronDown size={14} />
            </button>
          </div>
          {gear && (
            <section className="gear-panel">
              <Gear tackle={tackle} onChange={setTackle} />
            </section>
          )}
          <footer>
            <span>不是每一竿都有鱼。每一竿都有值得观察的东西。</span>
            <button onClick={openManual}>模拟依据与边界</button>
          </footer>
        </main>
      ) : (
        <main className="fishing-ground">
          <section className="conditions" aria-label="已锁定环境">
            <div className="location">
              <Compass size={17} />
              <strong>{currentSite.name}</strong>
              <span>
                {TIMES[w.env.time]} / {SEAS[w.env.sea]}
              </span>
            </div>
            <div className="condition-values">
              <span>
                <Wind size={14} />风 {w.env.wind.toFixed(1)} m/s
              </span>
              <span>
                <Waves size={14} />流 {Math.abs(w.env.flow).toFixed(2)} m/s{" "}
                {w.env.tide === "flood" ? "→" : "←"}
              </span>
              <span>
                <Lock size={12} />
                环境已锁定
              </span>
            </div>
          </section>
          <section className="field-stage">
            <div className="seascape">
              <Canvas
                kind="sea"
                env={w.env}
                world={w}
                aim={aim}
                onAim={setAim}
              />
              <div className="scene-top">
                <span className={`phase-dot ${fight ? "fighting" : ""}`} />
                <span>
                  {ended
                    ? "本竿结束"
                    : fight
                      ? "中钩 · 控制张力"
                      : w.phase === "ready"
                        ? "准备抛投"
                        : sim.paused
                          ? "已暂停"
                          : "实战进行中"}
                </span>
                <span className="cast-number">
                  CAST {String(w.castCount).padStart(2, "0")}
                </span>
              </div>
              <div className="landmark">
                <span>{currentSite.en}</span>
                <h2>{currentSite.name}</h2>
                <p>{currentSite.label}</p>
              </div>
              <div className="scene-bottom">
                <span>
                  <Target size={13} />
                  点击海面选点 · {Math.hypot(aim.x, aim.y).toFixed(0)} m
                </span>
                <button
                  aria-label={sim.paused ? "继续实战" : "暂停实战"}
                  disabled={ended}
                  onClick={() => sim.setPaused(!sim.paused)}
                >
                  {sim.paused ? <Play size={14} /> : <Pause size={14} />}
                  <span>
                    {formatTime(w.phase === "ready" ? 0 : w.time - w.castTime)}
                  </span>
                </button>
              </div>
            </div>
            <aside className="observation">
              <div className="float-heading">
                <span className="eyebrow">FLOAT WATCH</span>
                <strong>只看这一颗漂。</strong>
              </div>
              <div className="float-window">
                <Canvas kind="float" env={w.env} world={w} aim={aim} />
                <span className="float-live">
                  {active ? "LIVE" : "STANDBY"}
                </span>
              </div>
              <div className="float-note">
                {fight
                  ? "持续收线，把鱼引回近岸。张力过高时调松泄力，避免完全失去受力。"
                  : "看持续位移，也看与浪的节奏。不预告鱼口，不显示水下答案。"}
              </div>
              <div className="line-gauge">
                <div>
                  <span>竿端负荷</span>
                  <strong>
                    {w.tension.toFixed(1)} <small>N</small>
                  </strong>
                </div>
                <div className="gauge-track">
                  <i
                    style={{
                      width: `${Math.min(100, (w.tension / Math.min(lineStrength(w), HOOKS.find((h) => h.id === w.tackle.hook)!.hold)) * 100)}%`,
                    }}
                  />
                </div>
                <span>
                  主线余量 {slack(w).toFixed(1)} m{" "}
                  <b>
                    {w.reel === "reel"
                      ? "收线中"
                      : w.reel === "feed"
                        ? "放线中"
                        : "自然漂流"}
                  </b>
                </span>
              </div>
              <div className="catch-count">
                <Fish size={18} />
                <span>
                  本场鱼获
                  <strong>
                    {w.catches.length}
                    <small>尾</small>
                  </strong>
                </span>
              </div>
            </aside>
          </section>
          <section className="field-console">
            <div className="console-actions">
              <div className="left-actions">
                <button
                  className="field-secondary"
                  disabled={ended || sim.paused || w.time - w.chumAt < 4}
                  onClick={() => {
                    sim.chum(aim);
                    setToast(
                      `诱饵落在 ${Math.hypot(aim.x, aim.y).toFixed(0)} m 处，接下来会随不同水层的流速漂移。`,
                    );
                  }}
                >
                  ⁙ 撒诱饵{" "}
                  <small>
                    {w.time - w.chumAt < 4
                      ? `${Math.ceil(4 - w.time + w.chumAt)}s`
                      : "4s 间隔"}
                  </small>
                </button>
                <button
                  className="field-secondary"
                  disabled={active}
                  onClick={() => setGear(!gear)}
                >
                  <Settings2 size={15} />
                  {active ? "收竿后换组" : "配置钓组"}
                </button>
              </div>
              <div className="right-actions">
                {active ? (
                  <>
                    <button
                      className="field-text"
                      onClick={() => {
                        sim.retrieve();
                        setReplay(null);
                        setToast("");
                      }}
                    >
                      收竿 · 结束本竿
                    </button>
                    <button
                      className="field-primary"
                      disabled={fight || sim.paused}
                      onClick={() => {
                        sim.strike();
                        setToast("");
                      }}
                    >
                      扬竿 <ArrowUp size={17} />
                    </button>
                  </>
                ) : (
                  <button className="field-primary" onClick={cast}>
                    {ended ? "换饵，再抛一竿" : "抛竿"}
                    <ArrowRight size={17} />
                  </button>
                )}
              </div>
            </div>
            <div className="line-controls">
              <div className="line-buttons">
                <span>控线</span>
                <button
                  disabled={!active || sim.paused}
                  className={w.reel === "feed" ? "active" : ""}
                  aria-pressed={w.reel === "feed"}
                  onClick={() => toggleReel("feed")}
                >
                  <ArrowDown size={14} />
                  放线
                </button>
                <button
                  disabled={!active || sim.paused}
                  className={w.reel === "reel" ? "active" : ""}
                  aria-pressed={w.reel === "reel"}
                  onClick={() => toggleReel("reel")}
                >
                  <RotateCcw size={14} />
                  收线
                </button>
              </div>
              <label className="control-range">
                <span>
                  泄力<strong>{(w.drag / 9.81).toFixed(1)} kg</strong>
                </span>
                <input
                  aria-label="泄力"
                  type="range"
                  min="2"
                  max="24"
                  step=".5"
                  value={w.drag}
                  disabled={ended}
                  onChange={(e) => sim.control("drag", Number(e.target.value))}
                />
              </label>
              <label className="control-range">
                <span>
                  竿角<strong>{w.rod}°</strong>
                </span>
                <input
                  aria-label="竿角"
                  type="range"
                  min="20"
                  max="75"
                  step="5"
                  value={w.rod}
                  disabled={ended}
                  onChange={(e) => sim.control("rod", Number(e.target.value))}
                />
              </label>
              <span className="kit-summary">
                {w.tackle.hook} 号钩 ·{" "}
                {BAITS.find((b) => b.id === w.tackle.bait)!.name}
                <br />
                钓棚 {w.tackle.depth.toFixed(1)} m · 子线 {w.tackle.line} mm
              </span>
            </div>
          </section>
          {toast && !ended && (
            <p className="field-toast" role="status">
              {toast}
            </p>
          )}
          {gear && !active && (
            <section className="gear-panel">
              <div className="gear-panel-head">
                <span>下一竿的配置</span>
                <button
                  aria-label="关闭钓组配置"
                  onClick={() => setGear(false)}
                >
                  <X size={17} />
                </button>
              </div>
              <Gear tackle={tackle} onChange={setTackle} />
            </section>
          )}
          {ended && w.result && (
            <section className="cast-review">
              <div className="review-heading">
                <div>
                  <span className="eyebrow">
                    AFTER THE CAST / 第 {w.castCount} 竿
                  </span>
                  <h2>{w.result.title}</h2>
                  <p>{w.result.detail}</p>
                  {w.result.fish && (
                    <strong className="landed-fish">
                      {SPECIES[w.result.fish.species].name} ·{" "}
                      {w.result.fish.length.toFixed(0)} cm ·{" "}
                      {w.result.fish.weight.toFixed(2)} kg
                    </strong>
                  )}
                </div>
                <span className="duration">
                  {formatTime(w.result.duration)}
                  <small>本竿时长</small>
                </span>
              </div>
              <div className="review-grid">
                <div className="review-map">
                  <Canvas
                    kind="review"
                    env={w.env}
                    world={w}
                    aim={aim}
                    frame={record}
                  />
                  <div className="map-legend">
                    <span>● 鱼群</span>
                    <span>━ 水面轨迹</span>
                    <span>━ 钩饵轨迹</span>
                    <span>· 诱饵</span>
                  </div>
                  <div className="map-legend species-legend">
                    {Object.entries(SPECIES).map(([key, s]) => (
                      <span key={key} style={{ color: s.color }}>
                        ● {s.name}
                      </span>
                    ))}
                  </div>
                  <label className="review-slider">
                    <span>{(replay ?? w.result.duration).toFixed(1)} s</span>
                    <input
                      aria-label="实战复盘时间"
                      type="range"
                      min="0"
                      max={Math.max(0.1, w.result.duration)}
                      step=".1"
                      value={replay ?? w.result.duration}
                      onChange={(e) => setReplay(Number(e.target.value))}
                    />
                  </label>
                </div>
                <div className="review-events">
                  <span className="eyebrow">这一竿真正发生的事</span>
                  {w.events.map((e, i) => (
                    <button
                      className={e.t <= (replay ?? Infinity) ? "past" : ""}
                      key={i}
                      onClick={() => setReplay(e.t)}
                    >
                      <time>{e.t.toFixed(1)}s</time>
                      <span>{e.text}</span>
                    </button>
                  ))}
                  <p>
                    鱼群按结构、水层与食物移动。相同落点再次抛投，未必得到相同结果。
                  </p>
                </div>
              </div>
            </section>
          )}
          <footer>
            <span>潮间实战场 · {currentSite.name} · 本场环境固定</span>
            <button onClick={openManual}>操作与模型说明</button>
            <a href="../v2/">回教学场</a>
          </footer>
        </main>
      )}
      {leaving && (
        <div className="field-modal-backdrop">
          <section
            className="field-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="exit-title"
          >
            <span className="eyebrow">离开这一片海</span>
            <h2 id="exit-title">退出后，重新选择环境。</h2>
            <p>
              本场鱼群状态、鱼获和当前钓组过程会结束。下次入场会建立新的鱼群分布。
            </p>
            <div className="modal-actions">
              <button
                className="field-secondary"
                onClick={() => {
                  setLeaving(false);
                  sim.setPaused(wasPaused);
                }}
              >
                继续留在这里
              </button>
              <button
                className="field-primary"
                onClick={() => {
                  sim.exit();
                  setLeaving(false);
                  setGear(false);
                  setToast("");
                }}
              >
                退出并重选 <ArrowRight size={16} />
              </button>
            </div>
          </section>
        </div>
      )}
      {about && (
        <div className="field-modal-backdrop" onClick={closeManual}>
          <section
            className="field-modal manual"
            role="dialog"
            aria-modal="true"
            aria-labelledby="manual-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              aria-label="关闭实战手册"
              onClick={closeManual}
            >
              <X size={20} />
            </button>
            <span className="eyebrow">FIELD MANUAL</span>
            <h2 id="manual-title">把注意力留给水面。</h2>
            <ol>
              <li>
                <strong>先选环境，再配置钓组。</strong>
                入场后环境锁定。钩号、饵、线和配重需要收竿后再换。
              </li>
              <li>
                <strong>点击海面，确定落点。</strong>
                可以先撒诱饵再抛，诱饵与钩饵会按各自的速度下沉和漂移。
              </li>
              <li>
                <strong>独立窗口观察漂相。</strong>
                含饵不一定立即下沉；波浪、风压线、触底和挂底都会改变漂的动作。
              </li>
              <li>
                <strong>收线、放线是持续操作。</strong>
                再按一次停止。扬竿前过多余线会损失传力；挂底时先试着放松，强拉会增加磨损。
              </li>
              <li>
                <strong>中钩后保持张力。</strong>
                收线把鱼带近，泄力允许强烈冲刺时出线。过紧可能断线或拉开小钩，连续松线可能脱钩。
              </li>
              <li>
                <strong>收竿后看水下。</strong>
                时间轴展示本次鱼群位置、钩饵路径和事件，不是预设答案动画。场内鱼会记住惊扰。
              </li>
            </ol>
            <details>
              <summary>模型依据与真实程度</summary>
              <p>
                这是更强调因果一致性的实战模拟，仍非真实钓场预测。鱼群使用“礁栖鲷类、巡游鲈类、小型啄食鱼”行为原型；不是某个地点、季节或具体鱼种的实测分布。
              </p>
              <p>
                栖息结构参考{" "}
                <a
                  href="https://www.dpird.nsw.gov.au/fishing/fish-species/species-list/yellowfin-bream"
                  target="_blank"
                  rel="noreferrer"
                >
                  NSW 渔业部门的鲷类栖息与食性资料
                </a>
                ；钩门、饵体与钩丝强度作为独立变量，参考{" "}
                <a
                  href="https://mustad-fishing.com/us/products/38104np"
                  target="_blank"
                  rel="noreferrer"
                >
                  Mustad 钩型规格
                </a>
                。本场钩号、口径、张力和中钩概率都是虚拟参数，不对应商品规格或实测保证。鱼、漂和钩由统一状态推进，使用简化阻力、约束、受力与行为规则。
              </p>
            </details>
            <button className="field-primary" onClick={closeManual}>
              明白，去钓一竿 <ArrowRight size={16} />
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
