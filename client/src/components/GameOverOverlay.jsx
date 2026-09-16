import { Eye, Plus, RotateCcw, Share2, Undo2 } from "lucide-react";
import { COLOR_NAME } from "../game/constants.js";

export function GameOverOverlay({ outcome, moveCount, canUndo, onUndo, onClose, onReview, onRestart, onNewGame, onShare }) {
  const title = outcome.winner ? `${COLOR_NAME[outcome.winner]} prevails` : "Honours even";
  const result = outcome.winner === "w" ? "1 — 0" : outcome.winner === "b" ? "0 — 1" : "½ — ½";
  const moveLabel = `${Math.ceil(moveCount / 2)} ${Math.ceil(moveCount / 2) === 1 ? "move" : "moves"}`;
  const detail = outcome.type === "resignation"
    ? "The game ended by resignation."
    : outcome.type === "checkmate"
      ? "Checkmate closes the position."
      : `Draw by ${outcome.reason}.`;

  return (
    <div className="modal-backdrop game-over-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose?.(); }}>
      <div className="game-over-card" role="dialog" aria-modal="true" aria-labelledby="game-over-title" aria-describedby="game-over-detail">
        <div className="king-seal">♚</div>
        <p className="eyebrow">Game complete</p>
        <h2 id="game-over-title">{title}</h2>
        <p id="game-over-detail">{detail}</p>
        <div className="game-over-result" aria-label={`${result}, ${moveLabel}`}>
          <span>Result</span>
          <strong>{result}</strong>
          <i />
          <span>{moveLabel}</span>
        </div>
        <div className="game-over-actions">
          <button className="primary-button" autoFocus onClick={onReview}><Eye size={17} />Review game</button>
          <button className="secondary-button" onClick={onRestart}><RotateCcw size={17} />Restart</button>
          <button className="secondary-button" onClick={onNewGame}><Plus size={17} />New game</button>
          <button className="secondary-button" onClick={onUndo} disabled={!canUndo}><Undo2 size={17} />Undo last move</button>
          <button className="secondary-button game-over-share" onClick={onShare}><Share2 size={17} />Share PGN</button>
        </div>
      </div>
    </div>
  );
}
