import { useEffect, useState } from "react";
import {
  Waves,
  Layers3,
  ScanLine,
  FlaskConical,
  Activity,
  Wind,
  Compass,
  ChevronRight,
  ArrowUpRight,
  BookOpen,
  Check,
  LockKeyhole,
  X,
  ArrowRight,
  Info,
} from "lucide-react";
import { RigExplorer } from "./components/RigExplorer";
import { SimulationLab } from "./components/SimulationLab";
import { BalanceLab } from "./components/BalanceLab";
import { SignalLab } from "./components/SignalLab";
import { Training } from "./components/Training";
import {
  readProgress,
  saveProgress,
  EMPTY,
  type Progress,
} from "./training/progress";
const modules = [
  { id: "rig", name: "钓组拆解", sub: "认识每个部件的意义", icon: Layers3 },
  { id: "water", name: "入水状态", sub: "看见真实的水下关系", icon: ScanLine },
  {
    id: "balance",
    name: "阿波实验室",
    sub: "寻找浮力与配重的平衡",
    icon: FlaskConical,
  },
  {
    id: "signal",
    name: "漂相识别",
    sub: "从观察到有依据的判断",
    icon: Activity,
  },
  { id: "bait", name: "水流与诱饵", sub: "理解钩饵与诱饵的同步", icon: Wind },
  { id: "game", name: "实战模拟", sub: "在情境中运用你的判断", icon: Compass },
];
const titles: Record<string, [string, string, string]> = {
  rig: [
    "01",
    "从一套钓组，理解水下的因果。",
    "点一下、关掉它、看变化。每个部件都在改变某个物理状态。",
  ],
  water: [
    "02",
    "水面之下，发生了什么？",
    "三个视角，同一套钓组。改变一个变量，观察它如何传递到水下。",
  ],
  balance: [
    "03",
    "好的配重，是有依据的取舍。",
    "调节负载，观察吃水与下沉。理解灵敏度，也理解它的代价。",
  ],
  signal: [
    "04",
    "读懂漂相，而不只是看见漂动。",
    "从水面的细微变化出发，追踪水下原因，再决定下一步。",
  ],
  bait: [
    "05",
    "让钩饵与诱饵，相遇在水下。",
    "后续阶段将加入漂移、扩散与下沉，比较两条路径的重合。",
  ],
  game: [
    "06",
    "把观察，变成一次完整的判断。",
    "后续阶段将把装备、落点、控线和漂相串成可回放的一局。",
  ],
};
export default function App() {
  const [page, setPage] = useState("rig"),
    [signalTab, setSignalTab] = useState("library"),
    [guide, setGuide] = useState(false),
    [progress, setProgress] = useState<Progress>(readProgress),
    [storageOk, setStorageOk] = useState(true);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [page, signalTab]);
  const [backup, setBackup] = useState<Progress | null>(null);
  const update = (next: Progress) => {
    setProgress(next);
    setStorageOk(saveProgress(next));
  };
  const learn = (id: string) => {
    if (!progress.explored.includes(id))
      update({ ...progress, explored: [...progress.explored, id] });
  };
  const train = () => {
    setPage("signal");
    setSignalTab("training");
  };
  const title = titles[page];
  const finish = (identified: boolean | null, action: boolean) => {
    update({
      ...progress,
      explored: [...new Set([...progress.explored, "training"])],
      attempts: progress.attempts + 1,
      identified: progress.identified + (identified === true ? 1 : 0),
      evaluated: progress.evaluated + (identified === null ? 0 : 1),
      actions: progress.actions + (action ? 1 : 0),
    });
  };
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          className="brand"
          aria-label="潮间训练室首页"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setPage("rig");
          }}
        >
          <span className="brand-symbol">
            <Waves size={25} />
          </span>
          <span>
            <strong>
              潮间<span> TIDE LAB</span>
            </strong>
            <small>阿波钓法可视化训练室</small>
          </span>
        </a>
        <div className="sidebar-label">
          LEARNING STUDIO <span>学习空间</span>
        </div>
        <nav aria-label="学习区域">
          {modules.map((m, i) => (
            <button
              key={m.id}
              aria-label={m.name}
              onClick={() => setPage(m.id)}
              className={page === m.id ? "active" : ""}
              aria-current={page === m.id ? "page" : undefined}
            >
              <m.icon size={18} strokeWidth={1.5} />
              <span>
                <b>{m.name}</b>
                <small>{m.sub}</small>
              </span>
              {i > 3 ? (
                <LockKeyhole size={12} />
              ) : (
                <span className="nav-number">0{i + 1}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-practice">
          <span className="eyebrow">A LITTLE PRACTICE, EVERY DAY</span>
          <h3>直觉，来自一次次观察。</h3>
          <p>
            不急着扬竿。
            <br />
            先问自己：还有别的解释吗？
          </p>
          <button onClick={train}>
            开始漂相训练 <ArrowUpRight size={16} />
          </button>
        </div>
        <div className="sidebar-bottom">
          <span>
            <i /> 本地教学实验室
          </span>
          <small>MVP 0.1 · 无需登录</small>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div>
            <span>学习空间</span>
            <ChevronRight size={13} />
            <strong>{modules.find((m) => m.id === page)?.name}</strong>
          </div>
          <button className="text-button" onClick={() => setGuide(true)}>
            <BookOpen size={15} /> 使用指南
          </button>
        </header>
        <main>
          <div className="page-intro">
            <div>
              <span className="eyebrow">
                THE ART OF READING THE WATER / MODULE {title[0]}
              </span>
              <h1>{title[1]}</h1>
              <p>{title[2]}</p>
            </div>
            <div className="intro-stamp">
              <Waves size={26} strokeWidth={1} />
              <span>看见 · 理解 · 判断</span>
            </div>
          </div>
          <div className="learning-progress">
            {[
              { id: "rig", label: "认识装备" },
              { id: "water", label: "理解水下" },
              { id: "balance", label: "掌握配重" },
              { id: "signal", label: "理解信号" },
              { id: "training", label: "练习判断" },
            ].map((s, i) => (
              <button
                key={s.id}
                className={
                  (progress.explored.includes(s.id) ? "done " : "") +
                  (page === s.id ||
                  (s.id === "training" &&
                    page === "signal" &&
                    signalTab === "training")
                    ? "current"
                    : "")
                }
                onClick={() => (s.id === "training" ? train() : setPage(s.id))}
              >
                <span>
                  {progress.explored.includes(s.id) ? (
                    <Check size={11} />
                  ) : (
                    String(i + 1).padStart(2, "0")
                  )}
                </span>
                {s.label}
                {i < 4 && <ChevronRight size={12} />}
              </button>
            ))}
            <span className="progress-count">
              已体验 {progress.explored.length}/5
            </span>
          </div>
          {page === "rig" && <RigExplorer onLearn={() => learn("rig")} />}
          {page === "water" && <SimulationLab onLearn={() => learn("water")} />}
          {page === "balance" && (
            <BalanceLab onLearn={() => learn("balance")} />
          )}
          {page === "signal" && (
            <>
              <div className="section-tabs">
                <button
                  className={signalTab === "library" ? "active" : ""}
                  onClick={() => setSignalTab("library")}
                >
                  漂相观察室 <span>15</span>
                </button>
                <button
                  className={signalTab === "training" ? "active" : ""}
                  onClick={() => setSignalTab("training")}
                >
                  判断训练 <span>练习</span>
                </button>
                <div>
                  已练习 <b>{progress.attempts}</b> 次 · 原因命中{" "}
                  <b>
                    {progress.identified}/{progress.evaluated}
                  </b>{" "}
                  · 行动合理{" "}
                  <b>
                    {progress.actions}/{progress.attempts}
                  </b>
                </div>
              </div>
              {signalTab === "library" ? (
                <SignalLab onLearn={() => learn("signal")} onTrain={train} />
              ) : (
                <Training onFinish={finish} />
              )}
            </>
          )}
          {(page === "bait" || page === "game") && (
            <section className="card roadmap">
              <div className="roadmap-art">
                <Waves size={110} strokeWidth={0.5} />
              </div>
              <span className="badge">
                {page === "bait" ? "PHASE 6" : "PHASE 7"} · 尚未开放
              </span>
              <h2>
                {page === "bait"
                  ? "下一步，让两条路径相遇。"
                  : "实战之前，先把信号读懂。"}
              </h2>
              <p>
                {page === "bait"
                  ? "下一阶段将模拟诱饵扩散、下沉与漂移，显示与钩饵路径的空间重合，并接入鱼行为状态机。"
                  : "下一阶段将加入抛投、放线、X-Ray、整局回放与多原因诊断。当前 MVP 已提供独立漂相判断训练。"}
              </p>
              <div className="roadmap-steps">
                {(page === "bait"
                  ? ["撒饵与粒子路径", "鱼行为与三种模板", "可解释的同步率"]
                  : ["渐进式 8 关", "第一人称控线", "整局因果回放"]
                ).map((x, i) => (
                  <span key={x}>
                    <b>0{i + 1}</b>
                    {x}
                  </span>
                ))}
              </div>
              <button className="button primary" onClick={train}>
                先练习漂相判断 <ArrowRight size={15} />
              </button>
            </section>
          )}
          <footer className="app-footer">
            <span>
              潮间 TIDE LAB <i /> 让看不见的水下，变得可理解。
            </span>
            <span>
              {storageOk
                ? "学习记录仅保存在本机浏览器"
                : "浏览器存储不可用，本次记录仅暂存于内存"}
            </span>
          </footer>
        </main>
      </div>
      {guide && (
        <div className="modal-backdrop" onClick={() => setGuide(false)}>
          <section
            className="guide-modal"
            role="dialog"
            aria-modal="true"
            aria-label="使用指南"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Escape") setGuide(false);
            }}
          >
            <button
              className="icon-button modal-close"
              aria-label="关闭指南"
              autoFocus
              onClick={() => setGuide(false)}
            >
              <X size={18} />
            </button>
            <span className="eyebrow">WELCOME TO TIDE LAB</span>
            <h2>先观察，再改变一个变量。</h2>
            <ol>
              <li>
                <b>拆解钓组</b>
                <p>点击部件，尝试移除，理解它在受力链中的作用。</p>
              </li>
              <li>
                <b>对照实验</b>
                <p>三视图同步观察。暂停、调整流速或配重，比较深度和偏移。</p>
              </li>
              <li>
                <b>识别与复盘</b>
                <p>先看漂相，再揭示水下。盲看训练需完整播放 8 秒后作答。</p>
              </li>
            </ol>
            <div className="guide-note">
              <Info size={16} />
              <p>
                本版是半游动钓组的教学近似，不是海况预测器。漂相样本不证明真实鱼讯的唯一原因；“已体验”只记录交互，不代表已经掌握。
              </p>
            </div>
            <button
              className="button primary full"
              onClick={() => setGuide(false)}
            >
              开始探索
            </button>
            <button
              className="text-button"
              style={{ marginTop: 16, fontSize: 10 }}
              onClick={() => {
                if (backup) {
                  update(backup);
                  setBackup(null);
                } else {
                  setBackup(progress);
                  update({ ...EMPTY });
                }
              }}
            >
              {backup ? "撤销重置" : "重置本机学习记录"}
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
