import { SIGNALS, type Cause, type SignalCase } from "../data/signals";
export type Answer = Cause | "uncertain";
export type Action = "strike" | "wait";
export function chooseCase(
  previous?: string,
  random = Math.random,
): SignalCase {
  const pool = SIGNALS.filter((s) => s.id !== previous);
  return pool[
    Math.min(pool.length - 1, Math.max(0, Math.floor(random() * pool.length)))
  ];
}
export function evaluate(sample: SignalCase, answer: Answer, action: Action) {
  const identified = answer === "uncertain" ? null : answer === sample.cause;
  const actionCorrect =
    answer === "uncertain" ? action === "wait" : action === sample.action;
  return {
    identified,
    actionCorrect,
    title:
      identified === null
        ? "保留假设，继续找证据"
        : identified && actionCorrect
          ? "观察与行动，建立了联系"
          : identified
            ? "原因判断吻合，再想想行动时机"
            : "这个动作，还有另一种解释",
    actionExplanation:
      answer === "uncertain"
        ? "证据不足时暂缓扬竿是合理选择。训练揭示的是本片段设定的真相，不能证明实钓中的同类动作只有这个原因。"
        : sample.actionReason,
  };
}
