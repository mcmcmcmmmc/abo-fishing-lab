import { useId } from "react";
import type { Frame, Disturbance } from "../simulation/engine";
import type { Parameters } from "../physics/simulationConfig";
import { balance } from "../physics/model";
const calm: Disturbance = {
  dip: 0,
  side: 0,
  fishX: 2,
  fishDepth: 3,
  fishState: "巡游",
  source: "环境",
  sourceId: "calm",
  baitOffset: 0,
};
function Float({
  x,
  y,
  scale = 1,
  opacity = 1,
}: {
  x: number;
  y: number;
  scale?: number;
  opacity?: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={opacity}>
      <path d="M0-18C-15-4-14 13 0 17C14 13 15-4 0-18" fill="#ee8860" />
      <path d="M-11 3H11" stroke="#f8eac5" strokeWidth="5" />
      <path d="M-5-6Q-2-13 1-13" stroke="#ffc699" strokeWidth="2" fill="none" />
    </g>
  );
}
export function SurfaceView({
  frame,
  p,
  signal = calm,
  large = false,
}: {
  frame: Frame;
  p: Parameters;
  signal?: Disturbance;
  large?: boolean;
}) {
  const id = useId();
  const b = balance(p);
  const x =
    285 +
    Math.sin(frame.float.y * 0.2) * 30 +
    frame.float.x * 2 +
    signal.side * 20;
  const water = 158 + frame.wave * 24;
  const immersion = (1 - b.exposure) * 21;
  const y = water + immersion + frame.float.depth * 23 + signal.dip * 27 - 9;
  const wavePath = (row: number) =>
    Array.from(
      { length: 19 },
      (_, i) =>
        `${i ? "L" : "M"}${i * 36},${row + Math.sin(i * 0.7 + frame.time * 1.96) * p.wave * 10}`,
    ).join(" ");
  return (
    <svg
      className={"sea-svg surface " + (large ? "large" : "")}
      viewBox="0 0 640 270"
      role="img"
      aria-label="钓鱼者视角：只观察水面漂相"
    >
      <defs>
        <linearGradient id={id + "sky"} x2="0" y2="1">
          <stop stopColor="#c5dcd7" />
          <stop offset="1" stopColor="#e5e8d7" />
        </linearGradient>
        <linearGradient id={id + "sea"} x2="0" y2="1">
          <stop stopColor="#5c9e98" />
          <stop offset="1" stopColor="#164f55" />
        </linearGradient>
        <clipPath id={id + "above"}>
          <path d={`M0 0H640V${water + 3}Q320 ${water - 5} 0 ${water + 3}Z`} />
        </clipPath>
      </defs>
      <rect width="640" height="270" fill={`url(#${id}sky)`} />
      <circle cx="500" cy="47" r="23" fill="#f4ebca" opacity=".85" />
      <path
        d="M0 95L43 81L72 89L105 64L154 88L188 84L241 103H0"
        fill="#8aafa8"
      />
      <path
        d="M404 101L458 83L490 93L535 71L572 88L640 77V113H404"
        fill="#91b5ac"
      />
      <rect y="104" width="640" height="166" fill={`url(#${id}sea)`} />
      {[116, 130, 151, 180, 211, 246].map((r, i) => (
        <path
          key={r}
          d={wavePath(r)}
          fill="none"
          stroke="#b7d9c6"
          opacity={0.14 + i * 0.015}
          strokeWidth="1"
        />
      ))}
      <ellipse
        cx={x}
        cy={water + 4}
        rx="25"
        ry="4"
        stroke="#b6d5b9"
        fill="none"
        opacity=".5"
      />
      <path
        d={`M15 270Q130 170 ${x} ${y}`}
        fill="none"
        stroke="#cee1c4"
        opacity=".45"
        strokeWidth=".9"
      />
      <g clipPath={`url(#${id}above)`}>
        <Float x={x} y={y} scale={0.9} />
      </g>
      <path d="M39 270L183 202" stroke="#233d39" strokeWidth="5" />
      <path d="M42 270L111 238" stroke="#8a8771" strokeWidth="6" />
      <path d="M0 249L25 240L52 256L88 249L121 270H0" fill="#4c6760" />
      <text x="23" y="29" fill="#244f4e" fontSize="10" letterSpacing="1.5">
        A / 钓鱼者视角
      </text>
      <text x="615" y="245" textAnchor="end" fill="#bbd3c6" fontSize="10">
        观察：节奏 · 方向 · 持续性
      </text>
    </svg>
  );
}
export function TopView({
  frame,
  p,
  signal = calm,
}: {
  frame: Frame;
  p: Parameters;
  signal?: Disturbance;
}) {
  const x = 260 + frame.float.x * 5 + signal.side * 6,
    y = 125 + frame.float.y * 5;
  const dir = (p.currentDirection * Math.PI) / 180;
  return (
    <svg
      className="sea-svg"
      viewBox="0 0 640 270"
      role="img"
      aria-label="俯视图：阿波轨迹和流向"
    >
      <rect width="640" height="270" fill="#dcebe1" />
      <path
        d="M0 0H86L106 54L73 86L102 123L70 159L84 216L54 270H0Z"
        fill="#bdcbb8"
      />
      <path
        d="M86 0L106 54L73 86L102 123L70 159L84 216L54 270"
        fill="none"
        stroke="#8da990"
        strokeWidth="3"
      />
      {[0, 1, 2].flatMap((r) =>
        [0, 1, 2, 3].map((c) => (
          <g
            key={r + "-" + c}
            transform={`translate(${167 + c * 132} ${65 + r * 77}) rotate(${p.currentDirection})`}
            opacity=".35"
          >
            <path
              d={`M-15 0H${15 + p.current * 35}l-6-4m6 4l-6 4`}
              stroke="#548979"
              fill="none"
            />
          </g>
        )),
      )}
      <path
        d={frame.trail
          .map((v, i) => `${i ? "L" : "M"}${260 + v.x * 5},${125 + v.y * 5}`)
          .join(" ")}
        stroke="#489c81"
        strokeWidth="2"
        fill="none"
        strokeDasharray="4 4"
      />
      <circle cx="260" cy="125" r="4" fill="none" stroke="#61907c" />
      <circle cx={x} cy={y} r="22" stroke="#93b9a4" fill="none" />
      <circle cx={x} cy={y} r="6" fill="#e8825b" />
      <text x={x + 16} y={y - 14} fontSize="10" fill="#376a5a">
        阿波
      </text>
      <circle
        cx={x + (frame.hook.x - frame.float.x) * 8}
        cy={y + (frame.hook.y - frame.float.y) * 8}
        r="3"
        fill="#2c7164"
      />
      <text x="22" y="29" fill="#537469" fontSize="10" letterSpacing="1.5">
        B / 俯视轨迹
      </text>
      <text
        x="23"
        y="238"
        fill="#6c816e"
        fontSize="10"
        transform="rotate(-90 23 238)"
      >
        岸线
      </text>
      <path
        d={`M544 226l${Math.cos(dir) * 31} ${Math.sin(dir) * 31}`}
        stroke="#527b69"
        strokeWidth="2"
      />
      <text x="472" y="247" fill="#698c7c" fontSize="10">
        潮流 {p.current.toFixed(2)} m/s
      </text>
    </svg>
  );
}
export function UnderwaterView({
  frame,
  p,
  forces = false,
  signal = calm,
}: {
  frame: Frame;
  p: Parameters;
  forces?: boolean;
  signal?: Disturbance;
}) {
  const id = useId(),
    b = balance(p),
    scale = 205 / p.waterDepth;
  const fx = 295 + signal.side * 15,
    fy =
      61 +
      (1 - b.exposure) * 10 -
      5 +
      frame.float.depth * scale +
      signal.dip * 15;
  const hx = fx + (frame.hook.x - frame.float.x) * 34 + signal.side * 12,
    hookDepth = Math.min(
      p.waterDepth,
      Math.max(0, frame.hook.depth + signal.baitOffset),
    ),
    hy = 61 + hookDepth * scale;
  const arrow = (
    x: number,
    y: number,
    dx: number,
    dy: number,
    color: string,
    label: string,
  ) => (
    <g>
      <path
        d={`M${x} ${y}l${dx} ${dy}`}
        stroke={color}
        strokeWidth="2"
        markerEnd={`url(#${id}arrow)`}
      />
      <text x={x + dx + 7} y={y + dy} fill={color} fontSize="10">
        {label}
      </text>
    </g>
  );
  return (
    <svg
      className="sea-svg underwater"
      viewBox="0 0 640 310"
      role="img"
      aria-label="水下侧剖面：钩饵偏移和深度"
    >
      <defs>
        <linearGradient id={id + "water"} x2="0" y2="1">
          <stop stopColor="#18565a" />
          <stop offset="1" stopColor="#0b303a" />
        </linearGradient>
        <marker
          id={id + "arrow"}
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto-start-reverse"
        >
          <path d="M0 0L6 3L0 6" fill="none" stroke="context-stroke" />
        </marker>
      </defs>
      <rect width="640" height="310" fill={`url(#${id}water)`} />
      <path
        d="M0 61Q60 54 120 61T240 61T360 61T480 61T640 61V0H0Z"
        fill="#408780"
        opacity=".48"
      />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <path
            d={`M43 ${61 + (i * 205) / 3}H618`}
            stroke="#89b9b1"
            opacity=".1"
            strokeDasharray="3 7"
          />
          <text x="14" y={65 + (i * 205) / 3} fill="#85ada4" fontSize="10">
            {((p.waterDepth * i) / 3).toFixed(1)}m
          </text>
        </g>
      ))}
      <path
        d={`M0 282L72 266L132 275L177 254L221 269L304 278L382 264L459 271L509 246L564 264L640 256V310H0`}
        fill="#214449"
      />
      <path d="M481 281L494 255L515 243L535 265L549 284" fill="#35545a" />
      <path
        d={`M${fx} 63V266`}
        stroke="#9ac0ac"
        opacity=".25"
        strokeDasharray="4 5"
      />
      <path
        d={`M80 27Q215 10 ${fx} ${fy}`}
        stroke="#bdcdb0"
        fill="none"
        opacity=".65"
      />
      <path
        d={`M${fx} ${fy}Q${fx + (hx - fx) * 0.35} ${(fy + hy) * 0.65} ${hx} ${hy}`}
        stroke="#d6d6ad"
        fill="none"
        strokeWidth="1.5"
      />
      <Float x={fx} y={fy - 2} scale={0.65} />
      <circle
        cx={fx + (hx - fx) * 0.75}
        cy={fy + (hy - fy) * 0.75}
        r="4"
        fill="#a7b2a1"
      />
      <path d={`M${hx} ${hy - 5}v8q8 6 8-3`} fill="none" stroke="#d9dec4" />
      <circle cx={hx + 6} cy={hy + 1} r="4" fill="#ebac83" />
      <path
        d={`M${fx} ${hy + 18}H${hx}`}
        stroke="#7daf9c"
        strokeDasharray="3 4"
      />
      <text x={hx + 18} y={hy + 13} fill="#dddcc0" fontSize="11">
        钩饵 {hookDepth.toFixed(2)} m
      </text>
      <g
        transform={`translate(${hx + signal.fishX * 26} ${61 + signal.fishDepth * scale}) scale(${signal.sourceId === "nibble" ? 0.55 : 1})`}
        opacity=".65"
      >
        <path d="M-15 0Q0-13 19 0Q0 13-15 0L-25-9V9Z" fill="#7ca79b" />
        <circle cx="12" cy="-2" r="1.5" fill="#0a3d42" />
      </g>
      {signal.sourceId !== "calm" && frame.time >= 2 && (
        <g opacity={Math.min(1, (frame.time - 2) * 2)}>
          {["wind", "line"].includes(signal.sourceId) && (
            <g>
              <path
                d={
                  signal.sourceId === "wind"
                    ? `M80 27Q210 85 ${fx} ${fy}`
                    : `M80 27L${fx} ${fy}`
                }
                fill="none"
                stroke="#dfc780"
                strokeWidth="2.2"
              />
              <text x="107" y="51" fill="#dfc780" fontSize="11">
                {signal.sourceId === "wind" ? "风推动线弧 →" : "竿端牵引 →"}
              </text>
            </g>
          )}
          {["surge", "seam", "eddy"].includes(signal.sourceId) && (
            <g stroke="#86c6be" fill="none" strokeWidth="2">
              <path
                d={
                  signal.sourceId === "eddy"
                    ? "M425 100C520 70 525 175 449 170l9-9m-9 9l14 4"
                    : "M421 118h80l-10-6m10 6l-10 6M471 186h-65l10-6m-10 6l10 6"
                }
              />
              <text x="410" y="209" stroke="none" fill="#86c6be" fontSize="11">
                {signal.sourceId === "eddy" ? "回流转向" : "不同水层的流动变化"}
              </text>
            </g>
          )}
          {signal.sourceId === "wave" && (
            <path
              d={`M110 61Q150 ${40 + Math.sin(frame.time * 2) * 10} 190 61T270 61T350 61T430 61`}
              fill="none"
              stroke="#abcfb6"
              strokeWidth="2"
            />
          )}
          {signal.sourceId === "rock" && (
            <g>
              <path
                d={`M${hx - 35} 285L${hx - 10} ${fy + (hy - fy) * 0.75}L${hx + 20} ${fy + (hy - fy) * 0.75 - 12}L${hx + 51} 285Z`}
                fill="#526c69"
                opacity=".85"
              />
              <circle
                cx={fx + (hx - fx) * 0.75}
                cy={fy + (hy - fy) * 0.75}
                r="10"
                stroke="#efbb81"
                fill="none"
              />
              <text x={hx + 58} y="248" fill="#e8c592" fontSize="11">
                咬铅接触礁石
              </text>
            </g>
          )}
          {signal.sourceId === "bottom" && (
            <g>
              <path
                d={`M${hx - 32} ${hy + 5}h70`}
                stroke="#d6ba89"
                strokeWidth="4"
              />
              <circle cx={hx + 6} cy={hy} r="12" fill="none" stroke="#efbb81" />
              <text x={hx + 25} y={hy - 12} fill="#e8c592" fontSize="11">
                底部支撑钩饵
              </text>
            </g>
          )}
          {signal.fishState.includes("含饵") && (
            <g>
              <circle
                cx={hx + 6}
                cy={hy}
                r="8"
                fill="none"
                stroke="#eec58b"
                opacity=".8"
              />
              <text x={hx - 60} y={hy - 19} fill="#d6d9aa" fontSize="10">
                {signal.fishState}
              </text>
            </g>
          )}
        </g>
      )}
      {forces && (
        <g>
          {arrow(
            fx - 30,
            fy + 15,
            0,
            -Math.min(45, b.capacity * 1700),
            "#7bd3bb",
            "净浮力上限",
          )}
          {arrow(
            hx - 25,
            hy - 20,
            0,
            Math.min(45, b.gravity * 1700),
            "#e9af7a",
            "重力",
          )}
          {arrow(fx + 15, fy + 28, b.drag.x * 170, 0, "#88bccc", "水流拖曳")}
          {arrow(
            fx,
            29,
            p.wind * Math.cos((p.windDirection * Math.PI) / 180) * 5,
            0,
            "#d6d193",
            "风",
          )}
        </g>
      )}
      <text x="23" y="28" fill="#b4d2bc" fontSize="10" letterSpacing="1.5">
        C / 水下侧剖面
      </text>
      <text x="615" y="295" textAnchor="end" fill="#77a096" fontSize="10">
        二维投影 · 横向距离示意放大
      </text>
    </svg>
  );
}
