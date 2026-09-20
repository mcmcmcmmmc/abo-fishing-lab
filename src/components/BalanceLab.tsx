import { useState } from "react";
import { ArrowDown, ArrowRight, FlaskConical, RotateCcw } from "lucide-react";
import {
  CONTROLS,
  DEFAULTS,
  type Parameters,
} from "../physics/simulationConfig";
import { balance } from "../physics/model";
export function BalanceLab({ onLearn }: { onLearn: () => void }) {
  const [p, setP] = useState<Parameters>({ ...DEFAULTS }),
    [baseline, setBaseline] = useState<Parameters | null>(null);
  const b = balance(p),
    before = baseline ? balance(baseline) : null;
  const status =
    b.reserve < 0 ? "过重" : b.exposure > 0.38 ? "配重较轻" : "仍有承载余量";
  return (
    <div className="balance-layout">
      <section className="card balance-visual">
        <div className="card-heading">
          <div>
            <span className="eyebrow">03 / THE BALANCE LAB</span>
            <h2>在浮与沉之间，找到余量</h2>
          </div>
          <span className={"badge " + (b.overloaded ? "warn-badge" : "")}>
            {status}
          </span>
        </div>
        <div className="balance-stage">
          <svg
            viewBox="0 0 610 385"
            role="img"
            aria-label={`阿波等效露出比例 ${(b.exposure * 100).toFixed(0)}%`}
          >
            <defs>
              <linearGradient id="balanceWater" x2="0" y2="1">
                <stop stopColor="#d8e9dc" />
                <stop offset="1" stopColor="#bad6c6" />
              </linearGradient>
            </defs>
            <path
              d="M0 180Q60 172 120 180T240 180T360 180T480 180T610 180V385H0Z"
              fill="url(#balanceWater)"
            />
            <path
              d="M0 180Q60 172 120 180T240 180T360 180T480 180T610 180"
              fill="none"
              stroke="#79a58c"
            />
            {before && (
              <g
                opacity=".2"
                transform={`translate(203 ${180 + (1 - before.exposure) * 100 - 50 + (before.overloaded ? 70 : 0)})`}
              >
                <path
                  d="M0-60C-62 0-49 60 0 62C49 60 62 0 0-60"
                  fill="#527b67"
                />
                <text y="100" textAnchor="middle" fill="#315640" fontSize="11">
                  上次配置
                </text>
              </g>
            )}
            <g
              className="balance-float"
              style={{
                transform: `translate(340px, ${180 + (1 - b.exposure) * 100 - 50 + (b.overloaded ? 70 : 0)}px)`,
              }}
            >
              <path d="M0-60C-62 0-49 60 0 62C49 60 62 0 0-60" fill="#e7865c" />
              <path d="M-44 20H44" stroke="#f5e3bc" strokeWidth="15" />
              <path
                d="M-17-18Q-8-38 0-40"
                fill="none"
                stroke="#fdb486"
                strokeWidth="5"
              />
              <path d="M0 62v65" stroke="#698574" />
              <circle cy="105" r={5 + p.shot * 2} fill="#557366" />
            </g>
            <path
              d="M423 93v-30m0 0l-5 9m5-9l5 9"
              stroke="#4e9477"
              fill="none"
              strokeWidth="2"
            />
            <text x="442" y="80" fontSize="12" fill="#629577">
              浮力支撑
            </text>
            <path
              d="M423 254v30m0 0l-5-9m5 9l5-9"
              stroke="#b27b57"
              fill="none"
              strokeWidth="2"
            />
            <text x="442" y="274" fontSize="12" fill="#92755b">
              等效负载 {b.load.toFixed(2)} g
            </text>
            <text x="32" y="158" fill="#72937a" fontSize="11">
              静水基准线
            </text>
            <text x="32" y="340" fill="#72937a" fontSize="10">
              漂形仅为示意；露出比例按等截面近似计算。
            </text>
          </svg>
          <div className="exposure-readout">
            <span>等效露出比例</span>
            <strong>
              {(b.exposure * 100).toFixed(0)}
              <small>%</small>
            </strong>
          </div>
        </div>
        <div className="balance-equation">
          <span>
            承载量 <b>{p.buoyancy.toFixed(2)}</b>
          </span>
          <span>−</span>
          <span>
            负载 <b>{b.load.toFixed(2)}</b>
          </span>
          <span>=</span>
          <span className={b.overloaded ? "warning-text" : ""}>
            余量 <b>{b.reserve.toFixed(2)} g</b>
          </span>
        </div>
        <div className="card-footer">
          负载 = 咬铅 + 钩饵 + 鱼钩与连接件（0.10 g 等效）
        </div>
      </section>
      <section className="card balance-controls">
        <div className="panel-title">
          <FlaskConical size={16} />
          <h3>改变一个变量</h3>
          <button
            className="text-button"
            aria-label="重置配重实验"
            onClick={() => {
              setP({ ...DEFAULTS });
              setBaseline(null);
            }}
          >
            <RotateCcw size={14} />
          </button>
        </div>
        <div className="parameter-scroll">
          {CONTROLS.filter((c) =>
            ["buoyancy", "shot", "bait", "leader", "wave"].includes(c.key),
          ).map((c) => (
            <label className="slider-control" key={c.key}>
              <span>
                {c.label}
                <output>
                  {p[c.key].toFixed(2)} <small>{c.unit}</small>
                </output>
              </span>
              <input
                type="range"
                aria-label={c.label}
                min={c.min}
                max={c.max}
                step={c.step}
                value={p[c.key]}
                onChange={(e) => {
                  setP({ ...p, [c.key]: +e.target.value });
                  onLearn();
                }}
              />
              <span className="range-ends">
                <small>{c.min}</small>
                <small>{c.max}</small>
              </span>
            </label>
          ))}
          <button
            className="button outline full"
            style={{ marginTop: 25 }}
            onClick={() => setBaseline({ ...p })}
          >
            {baseline ? "更新对照配置" : "记下当前配置，作个对照"}
          </button>
        </div>
        <div className="panel-foot">
          没有一个适合所有情况的“最佳配重”。剩余承载量越小，轻微向下作用越容易淹没漂体，但波浪也更容易遮住漂顶。
        </div>
      </section>
      <div className="balance-metrics">
        {[
          [
            "灵敏度线索",
            `${Math.max(0, b.reserve).toFixed(2)} g`,
            "淹没前的等效负载余量。越小，微小向下作用越容易使漂顶消失。",
          ],
          [
            "稳定性线索",
            `${b.settlingTime.toFixed(2)} s`,
            "质量 / 阻尼的响应时间近似。时间越长，运动调整越慢；不等于所有海况都更稳定。",
          ],
          [
            "下沉速度",
            `${b.sinkSpeed.toFixed(2)} m/s`,
            "配重增加会加快下沉；长子线的阻力会减慢下沉。此值为入水阶段近似。",
          ],
          [
            "风浪辨识余量",
            p.wave === 0
              ? "静水基准"
              : b.exposure < 0.15
                ? "容易被浪遮蔽"
                : "仍需观察节奏",
            `当前浪高 ${p.wave.toFixed(2)} m。露出少且浪高时，漂顶可见性降低；不表示一定是假讯号。`,
          ],
        ].map(([name, value, desc]) => (
          <section className="card" key={name}>
            <span className="eyebrow">{name}</span>
            <strong>{value}</strong>
            <p>{desc}</p>
          </section>
        ))}
      </div>
      <div className="insight balance-chain">
        <ArrowDown size={20} />
        <span>咬铅增加</span>
        <ArrowRight size={15} />
        <span>吃水增加</span>
        <ArrowRight size={15} />
        <span>余量降低</span>
        <ArrowRight size={15} />
        <span>小扰动也能造成明显下沉</span>
      </div>
    </div>
  );
}
