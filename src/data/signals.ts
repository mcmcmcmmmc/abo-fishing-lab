export type Cause =
  | "fish"
  | "wave"
  | "wind"
  | "current"
  | "eddy"
  | "bottom"
  | "line"
  | "nibble";
export const CAUSES: { id: Cause; label: string }[] = [
  { id: "fish", label: "鱼吃饵" },
  { id: "wave", label: "浪涌" },
  { id: "wind", label: "风压主线" },
  { id: "current", label: "流速 / 流带变化" },
  { id: "eddy", label: "回流" },
  { id: "bottom", label: "触底 / 碰礁" },
  { id: "line", label: "主线绷紧" },
  { id: "nibble", label: "小鱼啄食" },
];
export interface SignalCase {
  id: string;
  name: string;
  cause: Cause;
  kind: "fish" | "environment";
  observation: string;
  candidates: string;
  clue: string;
  truth: string;
  action: "strike" | "wait";
  actionReason: string;
  events: { time: number; label: string }[];
}
const fishEvents = (motion: string) => [
  { time: 0.8, label: "鱼靠近钩饵" },
  { time: 2, label: "鱼吸入钩饵" },
  { time: 2.7, label: "松弛子线开始拉直" },
  { time: 3.4, label: "扰动传到阿波" },
  { time: 5.1, label: motion },
];
const envEvents = (source: string, effect: string) => [
  { time: 0.8, label: "钓组随流漂移" },
  { time: 2, label: source },
  { time: 2.7, label: "线组受力发生变化" },
  { time: 3.4, label: effect },
  { time: 5.1, label: "比较持续性与环境节奏" },
];
export const SIGNALS: SignalCase[] = [
  {
    id: "fast",
    name: "快速下沉",
    cause: "fish",
    kind: "fish",
    observation: "短暂预动后，阿波持续没入水中。",
    candidates: "吞饵游走、主线突然拉紧、流带边界都可能拉沉阿波。",
    clue: "不随浪峰恢复，原有漂移节奏也被打破；再结合主线是否被主动拉紧。",
    truth: "本片段中鱼吸饵后转身，拉直子线并持续带走钩饵。",
    action: "strike",
    actionReason:
      "片段末尾已出现持续单向拉动，可在控住余线后尝试扬竿。不是一见下沉就扬竿。",
    events: fishEvents("鱼转身，持续带走钩饵"),
  },
  {
    id: "slow",
    name: "缓慢阴漂",
    cause: "fish",
    kind: "fish",
    observation: "漂顶缓慢降低，几个浪周期后仍未回到原位。",
    candidates: "谨慎含饵、轻微压线、钩饵触底都有可能。",
    clue: "持续趋势比单次振幅更有价值，结合漂流是否被固定位置约束。",
    truth: "鱼含饵慢游，张力逐渐累积，阿波缓慢下沉。",
    action: "strike",
    actionReason:
      "本片段结束时拉动已持续，可控线后扬竿；早期轻微阴漂仍需观察。",
    events: fishEvents("鱼缓慢游离，张力继续增加"),
  },
  {
    id: "side",
    name: "横向移动",
    cause: "fish",
    kind: "fish",
    observation: "阿波偏离原漂流方向，横向位移逐渐增加。",
    candidates: "鱼横游、侧风、回流均可造成横移。",
    clue: "看是否在同一流场中突然改变方向，并与风浪变化脱钩。",
    truth: "鱼含饵横向游走，经子线牵动阿波。",
    action: "strike",
    actionReason: "本片段末尾持续横移且线组已受力，可控线后扬竿。",
    events: fishEvents("鱼含饵横向游动"),
  },
  {
    id: "pause",
    name: "停顿后加速",
    cause: "fish",
    kind: "fish",
    observation: "漂移短暂停顿，随后突然加速并下沉。",
    candidates: "鱼试探后游走、进入流带都可能造成速度改变。",
    clue: "把停顿、再次加速和持续下沉作为一组证据。",
    truth: "鱼先含住钩饵，随后转向游走，张力明显增加。",
    action: "strike",
    actionReason: "观察到后半段持续带走后再尝试扬竿，停顿阶段不急于动作。",
    events: fishEvents("结束停顿，转身加速"),
  },
  {
    id: "peck",
    name: "轻点后下沉",
    cause: "fish",
    kind: "fish",
    observation: "前几次只是轻点，随后出现持续下沉。",
    candidates: "小鱼反复啄食、鱼试探后吞饵、浪尖遮蔽。",
    clue: "区分早期反复点动与后期不恢复的持续牵引。",
    truth: "鱼先试探，随后吸入钩饵并离开。",
    action: "strike",
    actionReason: "本片段后期有持续受力，再扬竿比见轻点即扬竿更合理。",
    events: [
      { time: 0.8, label: "鱼靠近钩饵" },
      { time: 2, label: "鱼试探饵边" },
      { time: 2.7, label: "短促扰动沿子线传递" },
      { time: 3.4, label: "阿波开始轻点" },
      { time: 5.1, label: "吞饵后游离，形成持续下沉" },
    ],
  },
  {
    id: "rise",
    name: "异常上浮",
    cause: "fish",
    kind: "fish",
    observation: "阿波露出增多，与附近波浪的节奏不同。",
    candidates: "鱼带饵上游、负载触底卸重、诱饵或配重脱落。",
    clue: "上浮是张力减少的线索，单靠它还不足以判断钩是否已入口。",
    truth: "鱼含饵向上游，使钓组部分负载被托起，阿波回升。",
    action: "wait",
    actionReason:
      "仅凭上浮证据不足。先控线继续观察后续位移，不把上浮等同于已具备刺鱼时机。",
    events: fishEvents("鱼向上游，线组负载减小"),
  },
  {
    id: "wave",
    name: "浪涌",
    cause: "wave",
    kind: "environment",
    observation: "阿波随水面周期起落，短暂消失后又恢复。",
    candidates: "波浪遮蔽、连续试探吃口。",
    clue: "漂相周期与浪同步，没有持续的单向牵引。",
    truth: "波浪改变局部水面和漂体姿态，没有鱼含住钩饵。",
    action: "wait",
    actionReason: "等待波浪恢复并观察持续趋势，不能把每次没顶都当作吃口。",
    events: envEvents("浪峰到达阿波", "阿波随浪起伏"),
  },
  {
    id: "wind",
    name: "风压主线",
    cause: "wind",
    kind: "environment",
    observation: "阿波横移并缓慢压低，水面线弧也发生变化。",
    candidates: "鱼横游或侧风拖线。",
    clue: "主线先形成风弧，随后才牵动阿波；可通过压低竿尖或理线进一步验证。",
    truth: "侧风推动浮在水面的主线，张力把阿波拉偏。",
    action: "wait",
    actionReason:
      "先管理水面余线，观察异常是否随之减弱；不把风的持续牵引当作吃口。",
    events: envEvents("风推动水面主线", "主线风弧牵动阿波"),
  },
  {
    id: "surge",
    name: "水流突然变化",
    cause: "current",
    kind: "environment",
    observation: "阿波速度突变，同时出现短暂下压。",
    candidates: "鱼突然游走、流速改变。",
    clue: "观察附近水纹是否也一起加速，变化后是否重新稳定。",
    truth: "流速变化重新分配线组阻力，造成短暂张力峰值。",
    action: "wait",
    actionReason: "先观察新流速下是否稳定，再判断是否还有独立于水流的动作。",
    events: envEvents("局部流速增加", "阻力增加，阿波下压"),
  },
  {
    id: "eddy",
    name: "进入回流",
    cause: "eddy",
    kind: "environment",
    observation: "阿波变慢、转向，轨迹出现弧线。",
    candidates: "鱼带线转向、回流。",
    clue: "回流通常形成连续转弯，留意水面碎屑或泡沫的共同轨迹。",
    truth: "阿波进入回流，水面与水下线组受不同方向的水推动。",
    action: "wait",
    actionReason: "先确认流场与漂移轨迹，转向本身不是扬竿依据。",
    events: envEvents("阿波进入回流区", "漂移轨迹转弯"),
  },
  {
    id: "seam",
    name: "流带边界",
    cause: "current",
    kind: "environment",
    observation: "短暂停顿后下沉，外观很像鱼突然带走。",
    candidates: "鱼吃饵、表底流速度差突增。",
    clue: "是否恰好经过明显流带边界；重复同一路线能否在同一位置复现。",
    truth: "上下水层流速不同，跨越边界时线组被拉斜，阿波吃水增加。",
    action: "wait",
    actionReason: "先把流带边界列为候选解释，观察是否持续带离原流线。",
    events: envEvents("钓组跨过流带边界", "上下层流差拉斜线组"),
  },
  {
    id: "rock",
    name: "咬铅碰礁",
    cause: "bottom",
    kind: "environment",
    observation: "漂突然点动，随后停滞或被流拉低。",
    candidates: "鱼轻啄、咬铅触碰固定物。",
    clue: "异常与固定位置相关，漂流停止但水流仍在推动。",
    truth: "本教学片段的咬铅碰到礁石，接触约束突然改变张力。",
    action: "wait",
    actionReason: "先减小牵引并确认钓棚与海底位置，避免用猛烈扬竿加重挂底。",
    events: envEvents("咬铅碰到礁石", "受约束后阿波点动"),
  },
  {
    id: "bottom",
    name: "钩饵触底",
    cause: "bottom",
    kind: "environment",
    observation: "阿波先略微上浮，随后漂移减慢并被流压低。",
    candidates: "鱼向上游、钩饵落底卸重。",
    clue: "核对设定钓棚与水深，观察是否在同一浅点重复出现。",
    truth: "钩饵接触海底，部分重量由底部支撑，之后水流拉紧线组。",
    action: "wait",
    actionReason: "先调整钓棚，排除底部接触后再评价鱼讯。",
    events: envEvents("钩饵接触海底", "先卸重，再被水流拉紧"),
  },
  {
    id: "line",
    name: "主线突然绷紧",
    cause: "line",
    kind: "environment",
    observation: "阿波快速下压，很像一次强烈吃口。",
    candidates: "鱼突然拉走，或放线结束 / 竿端收线。",
    clue: "回看自己是否停止放线或移动竿尖；这是水面视角之外的重要信息。",
    truth: "竿端余线用尽，主线拉紧，向阿波施加牵引。",
    action: "wait",
    actionReason: "先排除自己控线造成的张力变化，再观察是否仍持续向外带线。",
    events: envEvents("竿端余线用尽", "主线突然拉紧阿波"),
  },
  {
    id: "nibble",
    name: "小鱼啄食",
    cause: "nibble",
    kind: "environment",
    observation: "反复短点，幅度小，每次很快恢复。",
    candidates: "小鱼啄食、目标鱼试探、细小波浪。",
    clue: "没有形成持续拉动；还需等待后续变化，不能仅凭轻点推断鱼的大小。",
    truth: "本片段由小鱼啄动饵边产生，未完整吞入钩饵。",
    action: "wait",
    actionReason: "等待更连续的含饵位移，不把轻点直接当成可靠刺鱼机会。",
    events: envEvents("小鱼啄动饵边", "短促信号间歇传递"),
  },
];
