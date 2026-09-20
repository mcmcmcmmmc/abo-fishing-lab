export interface Progress {
  version: 1;
  explored: string[];
  attempts: number;
  identified: number;
  evaluated: number;
  actions: number;
}
export const EMPTY: Progress = {
  version: 1,
  explored: [],
  attempts: 0,
  identified: 0,
  evaluated: 0,
  actions: 0,
};
export const KEY = "tide-abo-progress-v1";
export function parseProgress(raw: string | null): Progress {
  try {
    const v = JSON.parse(raw || "null");
    if (!v || v.version !== 1 || !Array.isArray(v.explored))
      return { ...EMPTY };
    const numbers = ["attempts", "identified", "evaluated", "actions"];
    if (
      numbers.some((k) => !Number.isSafeInteger(v[k]) || v[k] < 0) ||
      v.identified > v.evaluated ||
      v.evaluated > v.attempts ||
      v.actions > v.attempts
    )
      return { ...EMPTY };
    return {
      version: 1,
      explored: [
        ...new Set<string>(
          v.explored.filter(
            (x: unknown) =>
              typeof x === "string" &&
              ["rig", "water", "balance", "signal", "training"].includes(x),
          ),
        ),
      ],
      attempts: v.attempts,
      identified: v.identified,
      evaluated: v.evaluated,
      actions: v.actions,
    };
  } catch {
    return { ...EMPTY };
  }
}
export const readProgress = (): Progress => {
  try {
    return parseProgress(localStorage.getItem(KEY));
  } catch {
    return { ...EMPTY };
  }
};
export function saveProgress(p: Progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
    return true;
  } catch {
    return false;
  }
}
