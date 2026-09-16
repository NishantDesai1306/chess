export const DEFAULT_ENGINE_SKILL = 20;

export function normalizeEngineSkill(value) {
  const skill = Number(value);
  if (!Number.isFinite(skill)) return DEFAULT_ENGINE_SKILL;
  return Math.min(20, Math.max(0, Math.round(skill)));
}

export function getEngineLevel(skill) {
  const value = normalizeEngineSkill(skill);
  if (value <= 3) return { value, name: "Beginner", note: "Leaves opportunities and plays forgiving moves." };
  if (value <= 7) return { value, name: "Casual", note: "A relaxed opponent for an easy-going game." };
  if (value <= 12) return { value, name: "Club", note: "Solid play with room for practical chances." };
  if (value <= 16) return { value, name: "Expert", note: "Sharp play that punishes loose positions." };
  if (value <= 19) return { value, name: "Master", note: "A demanding opponent with few concessions." };
  return { value, name: "Maximum", note: "Stockfish plays at its full configured strength." };
}
