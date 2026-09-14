import { useEffect, useState } from "react";
import { Chess } from "chess.js";
import { StockfishClient } from "../engine/StockfishClient.js";
import { DEFAULT_FEN, PLAYER } from "../game/constants.js";
import audio from "../utils/audio.js";

export function useGameController({ session, onSessionChange }) {
  const [chess] = useState(() => createChess(session.pgn));
  const [engine] = useState(() => new StockfishClient(setEngineStatusSafely));
  const [revision, setRevision] = useState(0);
  const [orientation, setOrientation] = useState(session.orientation ?? "w");
  const [outcome, setOutcome] = useState(session.outcome ?? getOutcome(chess));
  const [evaluation, setEvaluation] = useState(null);
  const [engineStatus, setEngineStatus] = useState({ phase: "idle", progress: 0, message: "" });
  const [pendingPromotion, setPendingPromotion] = useState(null);
  const [toast, setToast] = useState("");

  function setEngineStatusSafely(status) {
    setEngineStatus(status);
  }

  const fen = chess.fen();
  const turn = chess.turn();
  const history = chess.history({ verbose: true });
  const currentPlayerType = session.players[turn];
  const canMove = !outcome && currentPlayerType === PLAYER.HUMAN;

  useEffect(() => {
    if (outcome) return undefined;
    let ignore = false;
    let moveTimer;

    setEngineStatus((current) => ({ ...current, phase: current.phase === "idle" ? "loading" : "thinking", message: "" }));
    engine.analyze(fen, 15).then((result) => {
      if (ignore) return;
      const normalizedValue = turn === "b" ? -result.score.value : result.score.value;
      setEvaluation({ ...result.score, value: normalizedValue });
      setEngineStatus({ phase: "ready", progress: 1, message: "" });

      if (currentPlayerType === PLAYER.COMPUTER) {
        moveTimer = window.setTimeout(() => commitMove(result.bestMove), 260);
      }
    }).catch((error) => {
      if (!ignore && error.name !== "AbortError") {
        setEngineStatus({ phase: "error", progress: 0, message: error.message });
      }
    });

    return () => {
      ignore = true;
      window.clearTimeout(moveTimer);
      engine.cancel();
    };
  }, [currentPlayerType, engine, fen, outcome, revision, turn]);

  useEffect(() => () => engine.destroy(), [engine]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(""), 1800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  function persist(nextOutcome = outcome, nextOrientation = orientation) {
    onSessionChange({
      ...session,
      pgn: chess.pgn(),
      orientation: nextOrientation,
      outcome: nextOutcome,
    });
  }

  function commitMove(move) {
    let result;
    try {
      result = chess.move(move);
    } catch {
      result = null;
    }
    if (!result) return false;

    const nextOutcome = getOutcome(chess);
    playMoveSound(chess, result, nextOutcome);
    setPendingPromotion(null);
    setOutcome(nextOutcome);
    setRevision((value) => value + 1);
    persist(nextOutcome);
    return true;
  }

  function requestMove(move) {
    const candidates = chess.moves({ square: move.from, verbose: true }).filter((candidate) => candidate.to === move.to);
    const promotionMoves = candidates.filter((candidate) => candidate.promotion);
    if (promotionMoves.length > 0) {
      setPendingPromotion({ ...move, color: turn });
      return false;
    }
    return commitMove(move);
  }

  function choosePromotion(piece) {
    if (!pendingPromotion) return;
    commitMove({ from: pendingPromotion.from, to: pendingPromotion.to, promotion: piece });
  }

  function cancelPromotion() {
    setPendingPromotion(null);
  }

  function undo() {
    if (history.length === 0) return;
    engine.cancel();
    chess.undo();
    const mixedPlayers = session.players.w !== session.players.b;
    if (mixedPlayers && session.players[chess.turn()] === PLAYER.COMPUTER && chess.history().length > 0) chess.undo();
    setOutcome(null);
    setPendingPromotion(null);
    setEvaluation(null);
    setRevision((value) => value + 1);
    persist(null);
  }

  function restart() {
    engine.cancel();
    chess.load(session.startingFen ?? DEFAULT_FEN);
    setOutcome(null);
    setPendingPromotion(null);
    setEvaluation(null);
    setRevision((value) => value + 1);
    persist(null);
    playAudio("gameStart");
  }

  function resign() {
    if (outcome) return;
    engine.cancel();
    const nextOutcome = { type: "resignation", winner: turn === "w" ? "b" : "w", reason: "resignation" };
    setOutcome(nextOutcome);
    persist(nextOutcome);
    playAudio("gameOver");
  }

  function flip() {
    const nextOrientation = orientation === "w" ? "b" : "w";
    setOrientation(nextOrientation);
    persist(outcome, nextOrientation);
  }

  async function copyFen() {
    try {
      await navigator.clipboard.writeText(chess.fen());
      setToast("FEN copied");
    } catch {
      setToast("Could not copy FEN");
    }
  }

  function retryEngine() {
    setEngineStatus({ phase: "loading", progress: 0, message: "" });
    engine.retry().then(() => setRevision((value) => value + 1)).catch(() => {});
  }

  return {
    chess,
    fen,
    turn,
    history,
    orientation,
    outcome,
    evaluation,
    engineStatus,
    pendingPromotion,
    toast,
    canMove,
    requestMove,
    choosePromotion,
    cancelPromotion,
    undo,
    restart,
    resign,
    flip,
    copyFen,
    retryEngine,
  };
}

function createChess(pgn) {
  const chess = new Chess();
  if (pgn) {
    try { chess.loadPgn(pgn); } catch { return new Chess(); }
  }
  return chess;
}

function getOutcome(chess) {
  if (chess.isCheckmate()) return { type: "checkmate", winner: chess.turn() === "w" ? "b" : "w", reason: "checkmate" };
  if (chess.isStalemate()) return { type: "draw", winner: null, reason: "stalemate" };
  if (chess.isInsufficientMaterial()) return { type: "draw", winner: null, reason: "insufficient material" };
  if (chess.isThreefoldRepetition()) return { type: "draw", winner: null, reason: "threefold repetition" };
  if (chess.isDrawByFiftyMoves()) return { type: "draw", winner: null, reason: "fifty-move rule" };
  if (chess.isDraw()) return { type: "draw", winner: null, reason: "draw" };
  return null;
}

function playMoveSound(chess, move, outcome) {
  if (outcome) playAudio("gameOver");
  else if (chess.inCheck()) playAudio("check");
  else if (move.captured) playAudio("capture");
  else playAudio("move");
}

function playAudio(name) {
  const promise = audio[name]?.play();
  promise?.catch(() => {});
}
