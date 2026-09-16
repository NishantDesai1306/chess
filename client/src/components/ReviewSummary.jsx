import { ArrowRight, RotateCcw } from "lucide-react";
import { EvaluationGraph } from "./EvaluationGraph.jsx";
import { COLOR_NAME } from "../game/constants.js";
import { countMoveClassifications, getBiggestTurningPoint } from "../game/review.js";

const CLASSIFICATION_ORDER = [
  { id: "great", label: "Great", symbol: "!" },
  { id: "best", label: "Best", symbol: "★" },
  { id: "excellent", label: "Excellent", symbol: "!" },
  { id: "good", label: "Good", symbol: "✓" },
  { id: "inaccuracy", label: "Inaccuracy", symbol: "?!" },
  { id: "mistake", label: "Mistake", symbol: "?" },
  { id: "blunder", label: "Blunder", symbol: "??" },
];

export function ReviewSummary({ outcome, opening, moves, analyses, classifications, progress, error, whiteAccuracy, blackAccuracy, onRetry, onStartReview, onRestart }) {
  const progressPercent = Math.round(progress / analyses.length * 100);
  const complete = progress === analyses.length;
  const counts = countMoveClassifications(classifications);
  const turningPoint = getBiggestTurningPoint(moves, classifications);
  const result = outcome?.winner === "w" ? "1 — 0" : outcome?.winner === "b" ? "0 — 1" : "½ — ½";

  return (
    <aside className="match-rail review-summary-rail">
      <header className="summary-hero">
        <div><p className="eyebrow">Game review</p><h1>{complete ? "The verdict is in" : "Reading the position"}</h1></div>
        <strong>{result}</strong>
      </header>

      <section className="summary-scorecard">
        {opening ? <p className="summary-opening"><span>{opening.eco}</span><strong>{opening.name}</strong></p> : null}
        <div className="accuracy-card accuracy-white"><span>White</span><strong>{whiteAccuracy ?? "—"}<small>{whiteAccuracy == null ? "" : "%"}</small></strong><i style={{ "--accuracy": `${whiteAccuracy ?? 0}%` }} /></div>
        <div className="accuracy-card accuracy-black"><span>Black</span><strong>{blackAccuracy ?? "—"}<small>{blackAccuracy == null ? "" : "%"}</small></strong><i style={{ "--accuracy": `${blackAccuracy ?? 0}%` }} /></div>
        <EvaluationGraph analyses={analyses} cursor={moves.length} />
        {!complete ? <div className="summary-progress"><i style={{ width: `${progressPercent}%` }} /><span>{progressPercent}% analysed</span></div> : null}
        {error ? <button className="review-error" type="button" onClick={onRetry}>{error} Try again.</button> : null}
      </section>

      <section className="classification-ledger">
        <h2>Move quality</h2>
        <div>{CLASSIFICATION_ORDER.map((item) => (
          <span className={`quality-${item.id}`} key={item.id} title={item.label}><i>{item.symbol}</i><strong>{counts[item.id] ?? 0}</strong><small>{item.label}</small></span>
        ))}</div>
      </section>

      <section className="turning-point-card">
        <p className="eyebrow">Biggest turning point</p>
        {turningPoint ? (
          <div><span className={`review-quality quality-${turningPoint.quality.id}`}>{turningPoint.quality.symbol}</span><p><strong>{Math.ceil(turningPoint.cursor / 2)}{turningPoint.cursor % 2 === 0 ? "…" : "."} {turningPoint.move.san}</strong><small>{COLOR_NAME[turningPoint.move.color]} · {turningPoint.quality.label}</small></p></div>
        ) : <p className="turning-point-pending">Stockfish is looking for the move that changed the game.</p>}
      </section>

      <footer className="summary-actions">
        <button className="primary-button" type="button" onClick={() => onStartReview(turningPoint?.cursor ?? 1)} disabled={progress < 2}><span>{complete ? "Review key moments" : "Start reviewing"}</span><ArrowRight size={17} /></button>
        <button type="button" onClick={onRestart}><RotateCcw size={15} />Restart game</button>
      </footer>
    </aside>
  );
}
