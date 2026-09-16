import { useEffect, useState } from "react";
import { Chess } from "chess.js";
import { BarChart3, ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, Flag, RotateCcw, ScanSearch } from "lucide-react";
import { ChessBoard } from "./ChessBoard.jsx";
import { EvaluationBar } from "./EvaluationBar.jsx";
import { EvaluationGraph } from "./EvaluationGraph.jsx";
import { ReviewMoveList } from "./ReviewMoveList.jsx";
import { ReviewSummary } from "./ReviewSummary.jsx";
import { useGameReview } from "../hooks/useGameReview.js";
import { calculateAccuracy, classifyReviewMoves, createReviewGame, getCoachMessage, getPrincipalVariationSan } from "../game/review.js";
import { recognizeOpening } from "../data/openings.js";

const KEY_CLASSIFICATIONS = new Set(["great", "inaccuracy", "mistake", "blunder"]);

export function GameReview({ session, history, appearance, orientation, analyzePosition, cancelAnalysis, onFinish, onRestart, onNewGame }) {
  const [{ positions, moves }] = useState(() => createReviewGame(session.startingFen, history));
  const [cursor, setCursor] = useState(moves.length);
  const [view, setView] = useState("summary");
  const { analyses, progress, error, retry } = useGameReview({ positions, analyzePosition, cancelAnalysis });
  const classifications = classifyReviewMoves(moves, positions, analyses);
  const position = positions[cursor];
  const chess = new Chess(position);
  const quality = cursor > 0 ? classifications[cursor - 1] : null;
  const whiteAccuracy = calculateAccuracy(moves, classifications, "w");
  const blackAccuracy = calculateAccuracy(moves, classifications, "b");
  const progressPercent = Math.round(progress / positions.length * 100);
  const opening = recognizeOpening(moves);
  const principalVariation = getPrincipalVariationSan(position, analyses[cursor]);

  useEffect(() => {
    function handleNavigation(event) {
      if (view !== "moves" || event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || isEditableTarget(event.target)) return;
      if (event.key === "ArrowLeft") setCursor((value) => Math.max(0, value - 1));
      else if (event.key === "ArrowRight") setCursor((value) => Math.min(moves.length, value + 1));
      else if (event.key === "Home") setCursor(0);
      else if (event.key === "End") setCursor(moves.length);
      else return;
      event.preventDefault();
    }
    window.addEventListener("keydown", handleNavigation);
    return () => window.removeEventListener("keydown", handleNavigation);
  }, [moves.length, view]);

  function handleNextKeyMove() {
    const nextIndex = classifications.findIndex((item, index) => index >= cursor && item && KEY_CLASSIFICATIONS.has(item.id));
    setCursor(nextIndex >= 0 ? nextIndex + 1 : moves.length);
  }

  function handleStartReview(nextCursor) {
    setCursor(Math.min(moves.length, Math.max(0, nextCursor)));
    setView("moves");
  }

  return (
    <main className="game-page review-page">
      <div className="ambient ambient-game" />
      <header className="game-header">
        <div className="brand"><span className="brand-mark">♞</span><span>Chess</span></div>
        <div className="game-header-meta"><span>Game review</span><i /><span>Depth 11</span></div>
        <div className="game-header-actions">
          <button className="header-zen" type="button" onClick={onFinish}>Finish review</button>
          <button className="header-new-game" onClick={onNewGame}>New game <span>↗</span></button>
        </div>
      </header>

      <section className="game-workspace review-workspace">
        <div className="board-column review-board-column">
          <div className="review-board-label"><span>Position</span><strong>{cursor === 0 ? "Start" : `${Math.ceil(cursor / 2)}${cursor % 2 === 0 ? "…" : "."} ${moves[cursor - 1].san}`}</strong></div>
          <div className="board-and-eval">
            <EvaluationBar evaluation={analyses[cursor]?.score ?? null} orientation={orientation} />
            <ChessBoard
              chess={chess}
              fen={position}
              turn={chess.turn()}
              orientation={orientation}
              appearance={appearance}
              canMove={false}
              lastMove={cursor > 0 ? moves[cursor - 1] : null}
              suggestedMove={analyses[cursor]?.bestMove ?? null}
            />
          </div>
          <p className="review-keyboard-hint"><kbd>←</kbd><kbd>→</kbd> Step through moves</p>
        </div>

        {view === "summary" ? (
          <ReviewSummary
            outcome={session.outcome}
            opening={opening}
            moves={moves}
            analyses={analyses}
            classifications={classifications}
            progress={progress}
            error={error}
            whiteAccuracy={whiteAccuracy}
            blackAccuracy={blackAccuracy}
            onRetry={retry}
            onStartReview={handleStartReview}
            onRestart={onRestart}
          />
        ) : <aside className="match-rail review-rail">
          <header className="review-heading">
            <div><p className="eyebrow">{cursor === 0 ? "Game overview" : `Move ${cursor} of ${moves.length}`}</p><h1>{quality?.label ?? (cursor === 0 ? "Your game, unpacked" : "Analysing move")}</h1></div>
            {quality ? <span className={`review-quality quality-${quality.id}`} title={quality.label}>{quality.symbol}</span> : <ScanSearch size={22} />}
          </header>

          <section className="review-summary">
            {opening ? <p className="review-opening"><span>{opening.eco}</span><strong>{opening.name}</strong></p> : null}
            <div><span>White accuracy</span><strong>{whiteAccuracy ?? "—"}{whiteAccuracy == null ? "" : "%"}</strong></div>
            <div><span>Black accuracy</span><strong>{blackAccuracy ?? "—"}{blackAccuracy == null ? "" : "%"}</strong></div>
            <EvaluationGraph analyses={analyses} cursor={cursor} />
            {progress < positions.length ? <div className="review-progress"><i style={{ width: `${progressPercent}%` }} /><span>Reviewing game · {progressPercent}%</span></div> : <p className="review-complete">Review complete</p>}
            {error ? <button className="review-error" type="button" onClick={retry}>{error} Try again.</button> : null}
          </section>

          <section className="review-coach" aria-live="polite">
            <span className="coach-seal">♝</span>
            <p>{getCoachMessage(cursor, moves, classifications, positions, analyses)}</p>
          </section>

          <section className="review-line">
            <span>Best line</span>
            <div>{principalVariation.length > 0 ? principalVariation.map((move, index) => <code key={`${index}-${move}`}>{move}</code>) : <small>{chess.isGameOver() ? "No continuation — game over." : "Calculating continuation…"}</small>}</div>
          </section>

          <section className="review-notation">
            <ReviewMoveList moves={moves} classifications={classifications} cursor={cursor} onSelect={setCursor} />
          </section>

          <footer className="review-navigation">
            <div>
              <button type="button" aria-label="First position" onClick={() => setCursor(0)} disabled={cursor === 0}><ChevronFirst size={18} /></button>
              <button type="button" aria-label="Previous move" onClick={() => setCursor((value) => Math.max(0, value - 1))} disabled={cursor === 0}><ChevronLeft size={20} /></button>
              <button type="button" aria-label="Next move" onClick={() => setCursor((value) => Math.min(moves.length, value + 1))} disabled={cursor === moves.length}><ChevronRight size={20} /></button>
              <button type="button" aria-label="Final position" onClick={() => setCursor(moves.length)} disabled={cursor === moves.length}><ChevronLast size={18} /></button>
            </div>
            <button className="next-key-move" type="button" onClick={handleNextKeyMove}>Next key move <ChevronRight size={16} /></button>
          </footer>
          <div className="review-actions"><button type="button" onClick={() => { setCursor(moves.length); setView("summary"); }}><BarChart3 size={15} />Summary</button><button type="button" onClick={onRestart}><RotateCcw size={15} />Restart</button><button type="button" onClick={onFinish}><Flag size={15} />Finish</button></div>
        </aside>}
      </section>
    </main>
  );
}

function isEditableTarget(target) {
  return target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
}
