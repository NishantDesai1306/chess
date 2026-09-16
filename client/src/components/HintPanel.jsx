import { Check, ChevronRight, Lightbulb, RotateCw, X } from "lucide-react";

const STEP_LABELS = ["Idea", "Piece", "Move", "Why"];

export function HintPanel({ stage, hint, engineStatus, onReveal, onRetry, onClose }) {
  const loading = !hint && engineStatus.phase !== "error";
  const nextLabel = stage === 1 ? "Show the Piece" : stage === 2 ? "Show the Move" : stage === 3 ? "Explain Why" : "Back to Notation";

  function handleNext() {
    if (stage >= 4) onClose();
    else onReveal();
  }

  return (
    <div className="hint-panel" aria-live="polite">
      <div className="hint-progress" aria-label={`Hint level ${stage} of 4`}>
        {STEP_LABELS.map((label, index) => <span className={index < stage ? "revealed" : ""} key={label}><i>{index < stage ? <Check size={9} aria-hidden="true" /> : index + 1}</i>{label}</span>)}
      </div>

      {loading ? (
        <div className="hint-loading"><span className="hint-orbit"><Lightbulb size={19} aria-hidden="true" /></span><strong>Studying the position…</strong><p>Stockfish is finding a reliable continuation.</p></div>
      ) : !hint && engineStatus.phase === "error" ? (
        <div className="hint-loading hint-error"><span className="hint-orbit"><Lightbulb size={19} aria-hidden="true" /></span><strong>Hint unavailable</strong><p>{engineStatus.message || "The local engine stopped."}</p><button type="button" onClick={onRetry}><RotateCw size={13} aria-hidden="true" />Retry Engine</button></div>
      ) : (
        <div className="hint-revelations">
          <HintCard level="01 · Idea" text={hint.clue} />
          {stage >= 2 ? <HintCard level="02 · Piece" text={hint.piece} /> : null}
          {stage >= 3 ? <HintCard level="03 · Move" text={hint.move} emphasis /> : null}
          {stage >= 4 ? <HintCard level="04 · Why it works" text={hint.explanation} line={hint.line} /> : null}
        </div>
      )}

      <footer className="hint-actions">
        <button type="button" onClick={onClose}><X size={14} aria-hidden="true" />Close</button>
        <button className="hint-next" type="button" disabled={!hint} onClick={handleNext}>{nextLabel}{stage < 4 ? <ChevronRight size={14} aria-hidden="true" /> : null}</button>
      </footer>
    </div>
  );
}

function HintCard({ level, text, emphasis = false, line = [] }) {
  return (
    <section className={emphasis ? "hint-card emphasis" : "hint-card"}>
      <span>{level}</span>
      <p>{text}</p>
      {line.length > 0 ? <div className="hint-line"><small>Best continuation</small><div>{line.map((move, index) => <code key={`${index}-${move}`}>{move}</code>)}</div></div> : null}
    </section>
  );
}
