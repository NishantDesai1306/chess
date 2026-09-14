import { RotateCcw } from "lucide-react";
import { COLOR_NAME } from "../game/constants.js";

export function GameOverOverlay({ outcome, onRestart, onNewGame }) {
  const title = outcome.winner ? `${COLOR_NAME[outcome.winner]} prevails` : "Honours even";
  const detail = outcome.type === "resignation" ? "The game ended by resignation." : outcome.type === "checkmate" ? "Checkmate closes the position." : `Draw by ${outcome.reason}.`;
  return <div className="modal-backdrop game-over-backdrop"><div className="game-over-card" role="dialog" aria-modal="true" aria-labelledby="game-over-title"><div className="king-seal">♚</div><p className="eyebrow">Game complete</p><h2 id="game-over-title">{title}</h2><p>{detail}</p><div className="game-over-actions"><button className="primary-button" onClick={onRestart}><RotateCcw size={17} />Play again</button><button className="secondary-button" onClick={onNewGame}>New game</button></div></div></div>;
}
