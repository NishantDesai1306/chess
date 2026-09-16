import { RotateCcw, X } from "lucide-react";
import { EngineLevelControl } from "./EngineLevelControl.jsx";

export function EnginePanel({ skill, status, onChange, onRetry, onClose }) {
  return (
    <div className="sheet-backdrop" role="presentation" onMouseDown={onClose}>
      <aside className="appearance-sheet engine-sheet" role="dialog" aria-modal="true" aria-labelledby="engine-panel-title" onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <div><p className="eyebrow">Playing strength</p><h2 id="engine-panel-title">Stockfish</h2></div>
          <button className="icon-button" aria-label="Close engine settings" onClick={onClose}><X size={19} /></button>
        </header>
        <section>
          <EngineLevelControl id="game-engine-level" value={skill} onChange={onChange} />
        </section>
        <p className="engine-level-help">Changes apply to the next search. Analysis remains fixed at depth 15.</p>
        {status.phase === "error" ? <button className="secondary-button engine-retry" onClick={onRetry}><RotateCcw size={16} />Retry engine</button> : null}
      </aside>
    </div>
  );
}
