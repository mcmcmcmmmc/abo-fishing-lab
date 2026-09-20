import { useState } from "react";
import { ArrowRight, RotateCcw, Eye, Power } from "lucide-react";
import { equipment, type PartId } from "../data/equipment";
export function RigExplorer({ onLearn }: { onLearn: () => void }) {
  const [selected, select] = useState<PartId>("stopper");
  const [removed, setRemoved] = useState<PartId[]>([]);
  const part = equipment.find((p) => p.id === selected)!;
  const off = removed.includes(selected);
  const limitOff = removed.includes("stopper") || removed.includes("bead");
  const toggle = () => {
    setRemoved((a) =>
      off ? a.filter((x) => x !== selected) : [...a, selected],
    );
    onLearn();
  };
  return (
    <div className="rig-layout">
      <section className="card rig-card">
        <div className="card-heading">
          <div>
            <span className="eyebrow">01 / EXPLODED VIEW</span>
            <h2>每个部件，都有它的理由</h2>
          </div>
          <span className="badge">半游动示例</span>
        </div>
        <div className="rig-workspace">
          <svg
            viewBox="0 0 590 640"
            role="group"
            aria-label="可点击的阿波钓组拆解图"
          >
            <defs>
              <linearGradient id="floatPaint" x2="1" y2="1">
                <stop stopColor="#ffb06d" />
                <stop offset="1" stopColor="#e76a42" />
              </linearGradient>
            </defs>
            <path d="M290 40V510Q290 540 290 580" className="rig-thread" />
            {equipment.map((p, i) => {
              const y = 40 + i * 54;
              const active = p.id === selected;
              const disabled = removed.includes(p.id);
              return (
                <g
                  key={p.id}
                  tabIndex={0}
                  role="button"
                  aria-label={"查看" + p.name}
                  onClick={() => select(p.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      select(p.id);
                    }
                  }}
                  className={"rig-node " + (active ? "active" : "")}
                >
                  <rect
                    x="240"
                    y={y - 20}
                    width="330"
                    height="42"
                    rx="10"
                    fill={active ? "#e5f0ea" : "transparent"}
                  />
                  <path
                    d={`M310 ${y}H353`}
                    stroke={active ? "#277d71" : "#b9c7c3"}
                    strokeDasharray="3 4"
                  />
                  <g opacity={disabled ? 0.22 : 1}>
                    {p.id === "rod" ? (
                      <path
                        d="M263 29L310 50"
                        stroke="#27474a"
                        strokeWidth="7"
                      />
                    ) : p.id === "float" ? (
                      <g transform={`translate(290 ${y})`}>
                        <path
                          d="M0-24C-27 2-22 24 0 26C22 24 27 2 0-24"
                          fill="url(#floatPaint)"
                        />
                        <path d="M-20 8H20" stroke="#fff4d9" strokeWidth="6" />
                      </g>
                    ) : p.id === "hook" ? (
                      <path
                        d={`M290 ${y - 15}v20q16 20 20-3l-5 4`}
                        fill="none"
                        stroke="#6e8589"
                        strokeWidth="3"
                      />
                    ) : p.id === "bait" ? (
                      <path
                        d={`M282 ${y - 6}q30-16 26 8q-15 16-26-8`}
                        fill="#eea78c"
                      />
                    ) : p.id === "mainline" || p.id === "leader" ? (
                      <path
                        d={`M290 ${y - 18}q-10 18 0 37`}
                        stroke="#678f87"
                        strokeWidth="2"
                        fill="none"
                      />
                    ) : p.id === "stopper" ? (
                      <g>
                        <path
                          d={`M282 ${y - 5}l17 10m-17 0l17-10`}
                          stroke="#ec7656"
                          strokeWidth="4"
                        />
                        <path d={`M286 ${y}l-16-10`} stroke="#ec7656" />
                      </g>
                    ) : p.id === "receiver" ? (
                      <path
                        d={`M278 ${y - 10}L302 ${y - 10}L290 ${y + 13}Z`}
                        fill="#83aaa0"
                      />
                    ) : (
                      <ellipse
                        cx="290"
                        cy={y}
                        rx={p.id === "swivel" ? 5 : 8}
                        ry={p.id === "swivel" ? 13 : 8}
                        fill={p.id === "bead" ? "#eac36c" : "#78908a"}
                      />
                    )}
                  </g>
                  <text
                    x="369"
                    y={y + 5}
                    fill={active ? "#176456" : "#546c69"}
                    fontSize="14"
                    fontWeight={active ? 650 : 400}
                  >
                    {p.name}
                  </text>
                  <text
                    x="540"
                    y={y + 4}
                    textAnchor="end"
                    fontSize="11"
                    fill="#91a4a0"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </text>
                </g>
              );
            })}
            <text x="35" y="600" fontSize="11" fill="#8c9e98">
              点击任意部件，追踪它的作用。
            </text>
          </svg>
          <div className="diagram-mark">
            <span>RIG STUDY</span>
            <strong>11</strong>
            <span>个部件，一条因果链</span>
          </div>
        </div>
        <div className="card-footer">
          <Eye size={15} /> 图示为结构拆解，不按实际长度比例绘制。
          <button className="text-button" onClick={() => setRemoved([])}>
            <RotateCcw size={13} />
            恢复全部
          </button>
        </div>
      </section>
      <div className="rig-details">
        <section className="card detail-card">
          <span className="eyebrow">{part.en}</span>
          <div className="part-title">
            <h2>{part.name}</h2>
            <span className="small-dot" />
          </div>
          <p>{part.role}</p>
          <label className="field-label">它改变什么</label>
          <div className="variable-chip">{part.variable}</div>
          <label className="field-label">作用如何传递</label>
          <div className="causal-list">
            {part.chain.map((x, i) => (
              <div key={x}>
                <span>{i + 1}</span>
                {x}
                {i < 2 && <ArrowRight size={14} />}
              </div>
            ))}
          </div>
          {part.removable ? (
            <button
              className={"button full " + (off ? "primary" : "outline")}
              onClick={toggle}
            >
              <Power size={16} />
              {off ? "恢复这个部件" : "关闭这个部件，看看会怎样"}
            </button>
          ) : (
            <p className="note">
              连接部件不提供断线实验；可在入水状态中调节对应参数。
            </p>
          )}
        </section>
        <section
          className={"experiment-card " + (off ? "experiment-active" : "")}
        >
          <span className="eyebrow">WHAT IF / 对照实验</span>
          <h3>{off ? "移除后的变化" : "让看不见的作用，变得可见"}</h3>
          <p>
            {off
              ? part.absent
              : "试着关闭棉线结或咬铅，观察右侧动画中的钩饵深度与线组姿态。"}
          </p>
          <svg viewBox="0 0 310 142" aria-label="关闭部件后的教学示意动画">
            <path
              d="M0 35Q40 28 80 35T160 35T240 35T320 35"
              stroke="#6da69b"
              fill="none"
            />
            <path d="M105 28v75" stroke="#a3b4af" strokeDasharray="4 4" />
            <text x="8" y="110" fill="#68857c" fontSize="10">
              预设线长
            </text>
            <g transform="translate(105 30)">
              <ellipse
                rx="8"
                ry="12"
                fill={removed.includes("float") ? "#bcc9c4" : "#ec8059"}
              />
            </g>
            <g
              className={
                limitOff || removed.includes("float")
                  ? "demo-sinking"
                  : removed.includes("shot")
                    ? "demo-drifting"
                    : "demo-steady"
              }
            >
              <path
                d="M105 40Q112 70 142 103"
                fill="none"
                stroke="#327f70"
                strokeWidth="2"
              />
              <circle
                cx="142"
                cy="103"
                r="5"
                fill={removed.includes("bait") ? "transparent" : "#e59a76"}
              />
            </g>
            <text x="187" y="79" fill="#327f70" fontSize="11">
              {limitOff
                ? "限位消失，继续下沉"
                : removed.includes("shot")
                  ? "更慢下沉，更易偏移"
                  : removed.includes("receiver")
                    ? "受流耦合减弱"
                    : "有配重、有深度限位"}
            </text>
          </svg>
          <small>关系示意动画。连续模拟请进入「入水状态」。</small>
        </section>
      </div>
    </div>
  );
}
