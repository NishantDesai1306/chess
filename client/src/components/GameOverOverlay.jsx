import { Eye, RotateCcw, Undo2 } from "lucide-react";
import { COLOR_NAME } from "../game/constants.js";

export function GameOverOverlay({ outcome, canUndo, onUndo, onDismiss, onRestart, onNewGame }) {
  const title = outcome.winner ? `${COLOR_NAME[outcome.winner]} prevails` : "Honours even";
  const detail = outcome.type === "resignation"
    ? "The game ended by resignation."
    : outcome.type === "checkmate"
      ? "Checkmate closes the position."
      : `Draw by ${outcome.reason}.`;

  return (
    <div className="modal-backdrop game-over-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onDismiss?.(); }}>
      <div className="game-over-card" role="dialog" aria-modal="true" aria-labelledby="game-over-title">
        <div className="king-seal">♚</div>
        <p className="eyebrow">Game complete</p>
        <h2 id="game-over-title">{title}</h2>
        <p>{detail}</p>
        <div className="game-over-actions">
          <button className="primary-button" onClick={onRestart}><RotateCcw size={17} />Play again</button>
          <button className="secondary-button" onClick={onNewGame}>New game</button>
          <button className="secondary-button" onClick={onUndo} disabled={!canUndo}><Undo2 size={17} />Undo</button>
          <button className="secondary-button" onClick={onDismiss}><Eye size={17} />Review board</button>
        </div>
      </div>
    </div>
  );
}
