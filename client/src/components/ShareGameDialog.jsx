import { useMemo, useState } from "react";
import { Check, Clipboard, Download, FileText, X } from "lucide-react";
import { copyText, createExportPgn, createPgnFilename, downloadPgn } from "../game/pgn.js";

export function ShareGameDialog({ session, pgn, fen, outcome, moveCount, onClose }) {
  const [feedback, setFeedback] = useState("");
  const exportPgn = useMemo(() => createExportPgn({
    pgn,
    startingFen: session.startingFen,
    players: session.players,
    engineSkill: session.engineSkill,
    outcome,
  }), [outcome, pgn, session.engineSkill, session.players, session.startingFen]);
  const result = outcome?.winner === "w" ? "1 — 0" : outcome?.winner === "b" ? "0 — 1" : outcome ? "½ — ½" : "In progress";

  async function handleCopy(value, successMessage) {
    try {
      await copyText(value);
      setFeedback(successMessage);
    } catch {
      setFeedback("Clipboard access was blocked");
    }
  }

  function handleDownload() {
    downloadPgn(exportPgn, createPgnFilename());
    setFeedback("PGN downloaded");
  }

  return (
    <div className="modal-backdrop share-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="share-dialog" role="dialog" aria-modal="true" aria-labelledby="share-game-title">
        <header>
          <div className="share-seal"><FileText size={20} /></div>
          <div><p className="eyebrow">Export game</p><h2 id="share-game-title">Take the scorecard with you</h2></div>
          <button className="icon-button" type="button" aria-label="Close export dialog" onClick={onClose}><X size={18} /></button>
        </header>

        <div className="share-meta" aria-label={`${result}, ${moveCount} ply`}>
          <span>{result}</span><i /><span>{moveCount} ply</span><i /><span>Portable PGN</span>
        </div>

        <label className="pgn-preview">
          <span>Game notation</span>
          <textarea readOnly rows="9" value={exportPgn} onFocus={(event) => event.currentTarget.select()} />
        </label>

        <div className="share-primary-actions">
          <button className="primary-button" type="button" onClick={() => handleCopy(exportPgn, "PGN copied to clipboard")}>
            {feedback === "PGN copied to clipboard" ? <Check size={17} /> : <Clipboard size={17} />} Copy PGN
          </button>
          <button className="secondary-button" type="button" onClick={handleDownload}><Download size={17} />Download .pgn</button>
        </div>

        <div className="share-footer">
          <p role="status" aria-live="polite">{feedback || "Compatible with Chess.com, Lichess, and desktop chess software."}</p>
          <button type="button" onClick={() => handleCopy(fen, "FEN copied to clipboard")}>Copy current FEN</button>
        </div>
      </section>
    </div>
  );
}
