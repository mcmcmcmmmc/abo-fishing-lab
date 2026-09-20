import { useState } from "react";
import { Pause, Play, RotateCcw, ArrowUpRight, Info } from "lucide-react";
import {
  DEFAULTS,
  constrain,
  type Parameters,
} from "../physics/simulationConfig";
import { balance } from "../physics/model";
import { useSimulation } from "../simulation/useSimulation";
import { SurfaceView, TopView, UnderwaterView } from "./SeaViews";
import { ParameterPanel } from "./ParameterPanel";
export function SimulationLab({ onLearn }: { onLearn: () => void }) {
  const [p, setP] = useState<Parameters>({ ...DEFAULTS }),
    [forces, setForces] = useState(true),
    [debug, setDebug] = useState(false);
  const sim = useSimulation(p),
    b = balance(p);
  return (
    <>
      <div className="simulation-layout">
        <div>
          <section className="card view-card">
            <div className="view-toolbar">
              <span className="live-label">
                <i />
                {sim.playing ? "模拟运行中" : "模拟已暂停"}
              </span>
              <span className="mono">{sim.frame.time.toFixed(1)} / 60.0 s</span>
              <div className="toolbar-actions">
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={forces}
                    onChange={(e) => setForces(e.target.checked)}
                  />
                  显示受力
                </label>
                <button
                  className="icon-button"
                  aria-label={sim.playing ? "暂停模拟" : "继续模拟"}
                  onClick={() => sim.setPlaying(!sim.playing)}
                >
                  {sim.playing ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <button
                  className="icon-button"
                  aria-label="重新抛投"
                  onClick={sim.reset}
                >
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>
            <div className="upper-views">
              <SurfaceView frame={sim.frame} p={p} />
              <TopView frame={sim.frame} p={p} />
            </div>
            <UnderwaterView frame={sim.frame} p={p} forces={forces} />
            <div className="view-bottom">
              <span>
                <i className="legend-dot coral" />
                阿波
              </span>
              <span>
                <i className="legend-dot sand" />
                钩饵 / 线组
              </span>
              <span>
                <i className="legend-dot mint" />
                漂移轨迹
              </span>
              <span>三视图同步 · 30 Hz</span>
            </div>
          </section>
          <div className="metric-row">
            <div>
              <span>钩饵实际深度</span>
              <strong>
                {sim.frame.hook.depth.toFixed(2)} <small>m</small>
              </strong>
            </div>
            <div>
              <span>漂饵水平偏移</span>
              <strong>
                {Math.hypot(
                  sim.frame.hook.x - sim.frame.float.x,
                  sim.frame.hook.y - sim.frame.float.y,
                ).toFixed(2)}{" "}
                <small>m</small>
              </strong>
            </div>
            <div>
              <span>设定钓棚（沿线）</span>
              <strong>
                {p.fishingDepth.toFixed(2)} <small>m</small>
              </strong>
            </div>
            <div>
              <span>剩余承载量</span>
              <strong className={b.overloaded ? "warning-text" : ""}>
                {b.reserve.toFixed(2)} <small>g 等效</small>
              </strong>
            </div>
          </div>
          <div className="insight">
            <div className="insight-icon">
              <ArrowUpRight size={19} />
            </div>
            <div>
              <h3>
                {sim.frame.bottom
                  ? "钩饵已经触底"
                  : b.overloaded
                    ? "配重超出承载量，阿波也在下沉"
                    : "阿波的位置，不是钩饵的位置"}
              </h3>
              <p>
                {sim.frame.bottom
                  ? "底部约束会改变线组张力。此时出现下沉，不足以证明鱼吃饵。"
                  : b.overloaded
                    ? "当前等效负载大于阿波承载量。先减轻配重或增加承载量，再比较正常漂相。"
                    : `水下流与表层流、风推动的速度不同，线组因此倾斜。当前模型预计稳定垂直深度约 ${b.targetDepth.toFixed(2)} m，沿线钓棚是 ${p.fishingDepth.toFixed(2)} m。试着把风速设为 0，再比较。`}
              </p>
            </div>
          </div>
        </div>
        <ParameterPanel
          p={p}
          onChange={(v) => {
            setP(constrain(v));
            onLearn();
          }}
          onReset={sim.reset}
        />
      </div>
      <div className="model-note">
        <Info size={14} />
        <span>
          教学近似：线性阻力、准静态线组倾角；不模拟真实湍流、线弹性或礁石碰撞。改变参数后需要时间达到新状态。
        </span>
        <button className="text-button" onClick={() => setDebug(!debug)}>
          Debug {debug ? "−" : "+"}
        </button>
      </div>
      {debug && (
        <pre className="debug">
          {JSON.stringify(
            {
              time: sim.frame.time,
              current: p.current,
              float: sim.frame.float,
              hook: sim.frame.hook,
              tension_N: sim.frame.tension,
              capacity_N: b.capacity,
              fishState: "未启用行为模型",
              biting: false,
              signalSource: sim.frame.bottom
                ? "触底"
                : b.overloaded
                  ? "过载"
                  : "环境漂流",
            },
            null,
            2,
          )}
        </pre>
      )}
    </>
  );
}
