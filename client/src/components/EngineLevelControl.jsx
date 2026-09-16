import { getEngineLevel, normalizeEngineSkill } from "../engine/levels.js";

export function EngineLevelControl({ id, value, onChange }) {
  const level = getEngineLevel(value);

  return (
    <div className="engine-level-control">
      <div className="engine-level-heading">
        <label htmlFor={id}>Stockfish strength</label>
        <output htmlFor={id}>Level {level.value} · {level.name}</output>
      </div>
      <input
        id={id}
        type="range"
        min="0"
        max="20"
        step="1"
        value={level.value}
        aria-valuetext={`Level ${level.value}, ${level.name}`}
        onChange={(event) => onChange(normalizeEngineSkill(event.target.value))}
      />
      <div className="engine-level-scale" aria-hidden="true"><span>Gentle</span><i /><span>Maximum</span></div>
      <p>{level.note}</p>
    </div>
  );
}
