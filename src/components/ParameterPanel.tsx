import { useState } from "react";
import { SlidersHorizontal, RotateCcw } from "lucide-react";
import {
  CONTROLS,
  DEFAULTS,
  type Parameters,
} from "../physics/simulationConfig";
export function ParameterPanel({
  p,
  onChange,
  onReset,
}: {
  p: Parameters;
  onChange: (p: Parameters) => void;
  onReset: () => void;
}) {
  const [group, setGroup] = useState("环境");
  return (
    <section className="card parameter-panel">
      <div className="panel-title">
        <SlidersHorizontal size={15} />
        <h3>实验参数</h3>
        <button
          aria-label="恢复默认参数"
          className="text-button"
          onClick={() => {
            onChange({ ...DEFAULTS });
            onReset();
          }}
        >
          <RotateCcw size={14} />
        </button>
      </div>
      <div className="segmented">
        {["环境", "钓组"].map((g) => (
          <button
            key={g}
            className={group === g ? "selected" : ""}
            onClick={() => setGroup(g)}
          >
            {g}
          </button>
        ))}
      </div>
      <div className="parameter-scroll">
        {CONTROLS.filter((c) => c.group === group).map((c) => (
          <label className="slider-control" key={c.key}>
            <span>
              {c.label}
              <output>
                {Number(p[c.key].toFixed(2))}
                <small> {c.unit}</small>
              </output>
            </span>
            <input
              aria-label={c.label}
              type="range"
              min={c.min}
              max={c.max}
              step={c.step}
              value={p[c.key]}
              onChange={(e) => onChange({ ...p, [c.key]: +e.target.value })}
            />
            <span className="range-ends">
              <small>{c.min}</small>
              <small>{c.max}</small>
            </span>
          </label>
        ))}
      </div>
      <div className="panel-foot">
        {group === "环境"
          ? "方向约定：0° 向右，90° 向离岸。风向为风推动线的方向。"
          : "承载量和重量均为教学等效值。子线不得长于总钓棚线长。"}
        <br />
        一次只改变一个变量，更容易发现因果。
      </div>
    </section>
  );
}
