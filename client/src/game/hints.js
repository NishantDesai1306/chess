import { Chess } from "chess.js";
import { getPrincipalVariationSan } from "./review.js";

const PIECE_NAMES = {
  p: "pawn",
  n: "knight",
  b: "bishop",
  r: "rook",
  q: "queen",
  k: "king",
};

const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 };
const CENTER_SQUARES = new Set(["d4", "e4", "d5", "e5"]);

export function createPositionHint(fen, analysis) {
  if (!analysis?.bestMove) return null;
  const chess = new Chess(fen);
  const sourcePiece = chess.get(analysis.bestMove.from);
  if (!sourcePiece) return null;

  let move;
  try {
    move = chess.move(analysis.bestMove);
  } catch {
    return null;
  }
  if (!move) return null;

  const line = getPrincipalVariationSan(fen, analysis, 7);
  const threatenedPiece = findStrongestThreat(chess, move);
  const clue = createClue(chess, move, threatenedPiece);
  const explanation = createExplanation(chess, move, threatenedPiece);
  const pieceName = PIECE_NAMES[sourcePiece.type];

  return {
    from: move.from,
    to: move.to,
    bestMove: analysis.bestMove,
    san: move.san,
    line,
    clue,
    piece: `The ${pieceName} on ${move.from} is the key piece.`,
    move: `Play ${move.san}.`,
    explanation,
  };
}

function createClue(chess, move, threatenedPiece) {
  if (chess.isCheckmate()) return "There is a forcing move that ends the game immediately.";
  if (chess.inCheck() && move.captured) return "Look for a capture that comes with check.";
  if (chess.inCheck()) return "Look for a forcing check that limits the opponent’s replies.";
  if (move.promotion) return "A pawn can reach the final rank with tempo.";
  if (move.flags.includes("k") || move.flags.includes("q")) return "King safety matters more than starting an attack here.";
  if (move.captured) return "A tactical capture changes the material balance right now.";
  if (threatenedPiece) return `Find a move that creates a direct threat against the ${PIECE_NAMES[threatenedPiece.type]}.`;
  if (CENTER_SQUARES.has(move.to)) return "Improve your control of the center with an active move.";
  return "Look for the move that improves your least active piece while keeping the position sound.";
}

function createExplanation(chess, move, threatenedPiece) {
  if (chess.isCheckmate()) return `${move.san} is checkmate: the king is attacked and has no legal escape, capture, or block.`;

  const reasons = [];
  if (move.captured) reasons.push(`removes the ${PIECE_NAMES[move.captured]} on ${move.to}`);
  if (chess.inCheck()) reasons.push("checks the king, forcing an immediate response");
  if (move.promotion) reasons.push(`promotes the pawn to a ${PIECE_NAMES[move.promotion]}`);
  if (move.flags.includes("k") || move.flags.includes("q")) reasons.push("moves the king to safety and connects the rooks");
  if (threatenedPiece) reasons.push(`attacks the ${PIECE_NAMES[threatenedPiece.type]} on ${threatenedPiece.square}`);
  if (reasons.length === 0 && isDevelopmentMove(move)) reasons.push(`develops the ${PIECE_NAMES[move.piece]} toward a more active square`);
  if (reasons.length === 0 && CENTER_SQUARES.has(move.to)) reasons.push("strengthens control of the center");
  if (reasons.length === 0) reasons.push(`places the ${PIECE_NAMES[move.piece]} more actively without weakening the position`);

  const joinedReasons = reasons.length === 1 ? reasons[0] : `${reasons.slice(0, -1).join(", ")} and ${reasons.at(-1)}`;
  return `${move.san} works because it ${joinedReasons}.`;
}

function findStrongestThreat(chess, move) {
  return chess.board()
    .flat()
    .filter((piece) => piece && piece.color !== move.color && piece.type !== "k")
    .filter((piece) => chess.attackers(piece.square, move.color).includes(move.to))
    .sort((left, right) => PIECE_VALUES[right.type] - PIECE_VALUES[left.type])[0] ?? null;
}

function isDevelopmentMove(move) {
  if (move.piece !== "n" && move.piece !== "b") return false;
  return move.from[1] === (move.color === "w" ? "1" : "8");
}
