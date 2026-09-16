import { Chess } from "chess.js";
import { DEFAULT_FEN } from "./constants.js";

export const REVIEW_DEPTH = 11;

export function createReviewGame(startingFen, history) {
  const chess = new Chess(startingFen ?? DEFAULT_FEN);
  const positions = [chess.fen()];
  const moves = [];

  history.forEach((move, index) => {
    const played = chess.move({ from: move.from, to: move.to, promotion: move.promotion });
    if (!played) return;
    moves.push({
      index: index + 1,
      color: played.color,
      from: played.from,
      to: played.to,
      promotion: played.promotion,
      san: played.san,
    });
    positions.push(chess.fen());
  });

  return { positions, moves };
}

export function getTerminalAnalysis(fen) {
  const chess = new Chess(fen);
  if (chess.isCheckmate()) {
    return { score: { type: "mate", value: chess.turn() === "w" ? -1 : 1 }, bestMove: null };
  }
  if (chess.isDraw()) return { score: { type: "cp", value: 0 }, bestMove: null };
  return null;
}

export function classifyReviewMoves(moves, positions, analyses) {
  return moves.map((move, index) => {
    const before = analyses[index];
    const after = analyses[index + 1];
    if (!before || !after) return null;

    const bestMove = before.bestMove;
    const isBest = bestMove && move.from === bestMove.from && move.to === bestMove.to
      && (!bestMove.promotion || move.promotion === bestMove.promotion);
    const expectedBefore = expectedPoints(before.score, move.color);
    const expectedAfter = expectedPoints(after.score, move.color);
    const loss = Math.max(0, expectedBefore - expectedAfter);
    const gain = expectedAfter - expectedBefore;

    if (isBest && gain >= .12) return classification("great", "Great", "!", loss);
    if (isBest) return classification("best", "Best", "★", loss);
    if (loss <= .02) return classification("excellent", "Excellent", "!", loss);
    if (loss <= .05) return classification("good", "Good", "✓", loss);
    if (loss <= .10) return classification("inaccuracy", "Inaccuracy", "?!", loss);
    if (loss <= .20) return classification("mistake", "Mistake", "?", loss);
    return classification("blunder", "Blunder", "??", loss);
  });
}

export function calculateAccuracy(moves, classifications, color) {
  const losses = moves
    .map((move, index) => move.color === color ? classifications[index]?.loss : null)
    .filter((loss) => typeof loss === "number");
  if (losses.length === 0) return null;
  const averageLoss = losses.reduce((sum, loss) => sum + loss, 0) / losses.length;
  return Math.max(0, Math.min(100, Math.round(100 * Math.exp(-3.2 * averageLoss))));
}

export function countMoveClassifications(classifications) {
  return classifications.reduce((counts, item) => {
    if (item) counts[item.id] = (counts[item.id] ?? 0) + 1;
    return counts;
  }, {});
}

export function getBiggestTurningPoint(moves, classifications) {
  let turningPoint = null;
  classifications.forEach((quality, index) => {
    if (!quality || (turningPoint && quality.loss <= turningPoint.quality.loss)) return;
    turningPoint = { move: moves[index], quality, cursor: index + 1 };
  });
  return turningPoint;
}

export function getBestMoveSan(fen, analysis) {
  if (!analysis?.bestMove) return null;
  try {
    return new Chess(fen).move(analysis.bestMove)?.san ?? null;
  } catch {
    return null;
  }
}

export function getPrincipalVariationSan(fen, analysis, maxPly = 8) {
  const variation = analysis?.pv?.length > 0
    ? analysis.pv
    : analysis?.bestMove
      ? [`${analysis.bestMove.from}${analysis.bestMove.to}${analysis.bestMove.promotion ?? ""}`]
      : [];
  if (variation.length === 0) return [];

  const chess = new Chess(fen);
  const sanMoves = [];
  for (const uci of variation.slice(0, maxPly)) {
    try {
      const played = chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
      if (!played) break;
      sanMoves.push(played.san);
    } catch {
      break;
    }
  }
  return sanMoves;
}

export function getCoachMessage(cursor, moves, classifications, positions, analyses) {
  if (cursor === 0) return "Start at the beginning, then step through the game to find where the position changed.";
  const move = moves[cursor - 1];
  const quality = classifications[cursor - 1];
  if (!quality) return "This move is waiting for Stockfish’s review.";
  const bestMove = getBestMoveSan(positions[cursor - 1], analyses[cursor - 1]);
  const bestCopy = bestMove && quality.id !== "best" && quality.id !== "great" ? ` Stockfish preferred ${bestMove}.` : "";
  const messages = {
    great: "A turning-point move that found the strongest continuation.",
    best: "The engine’s first choice. This keeps the position on its best course.",
    excellent: "A precise move with almost no value left on the table.",
    good: "A sound move, though a slightly stronger continuation was available.",
    inaccuracy: "This gives away a small part of the position’s potential.",
    mistake: "This move noticeably worsens the position.",
    blunder: "This is the critical error—the position changes sharply here.",
  };
  return `${move.san}: ${messages[quality.id]}${bestCopy}`;
}

function expectedPoints(score, color) {
  let whiteExpected;
  if (score.type === "mate") whiteExpected = score.value > 0 ? 1 : 0;
  else whiteExpected = 1 / (1 + Math.exp(-score.value / 180));
  return color === "w" ? whiteExpected : 1 - whiteExpected;
}

function classification(id, label, symbol, loss) {
  return { id, label, symbol, loss };
}
