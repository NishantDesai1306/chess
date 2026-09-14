import { useEffect, useRef } from "react";
import { Chessboard, COLOR, INPUT_EVENT_TYPE, MARKER_TYPE, SQUARE_SELECT_TYPE } from "cm-chessboard";
import { Arrows, ARROW_TYPE } from "cm-chessboard/src/cm-chessboard/extensions/arrows/Arrows.js";
import { BOARD_THEMES, PIECE_SETS } from "../utils/storage.js";

export function ChessBoard({ chess, fen, turn, orientation, appearance, canMove, onMove }) {
  const containerRef = useRef(null);
  const boardRef = useRef(null);
  const onMoveRef = useRef(onMove);
  const arrowsRef = useRef([]);
  const arrowStartRef = useRef(null);
  const boardKey = `${appearance.boardTheme}:${appearance.pieceSet}:${appearance.coordinates}`;

  useEffect(() => { onMoveRef.current = onMove; }, [onMove]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    const pieceSet = PIECE_SETS.find((set) => set.id === appearance.pieceSet) ?? PIECE_SETS[0];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const board = new Chessboard(container, {
      position: fen,
      orientation,
      animationDuration: reducedMotion ? 0 : 260,
      sprite: { url: pieceSet.url },
      style: {
        cssClass: `board-${appearance.boardTheme}`,
        borderType: "none",
        showCoordinates: appearance.coordinates,
      },
      extensions: [{ class: Arrows, props: { sprite: { url: "/assets/images/arrows.svg" } } }],
    });
    board.enableSquareSelect(({ type, square }) => {
      if (!square || type === SQUARE_SELECT_TYPE.primary) {
        arrowStartRef.current = null;
        return;
      }
      if (!arrowStartRef.current) {
        arrowStartRef.current = square;
        return;
      }
      const from = arrowStartRef.current;
      const to = square;
      arrowStartRef.current = null;
      if (from === to) return;
      const existing = arrowsRef.current.findIndex((arrow) => arrow.from === from && arrow.to === to);
      if (existing >= 0) {
        board.removeArrows(ARROW_TYPE.default, from, to);
        arrowsRef.current.splice(existing, 1);
      } else {
        board.addArrow(ARROW_TYPE.default, from, to);
        arrowsRef.current.push({ from, to });
      }
    });
    boardRef.current = board;
    return () => {
      arrowsRef.current = [];
      board.destroy();
      container.replaceChildren();
      boardRef.current = null;
    };
  }, [appearance.boardTheme, appearance.coordinates, appearance.pieceSet]);

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    board.setPosition(fen, true);
    board.removeMarkers(MARKER_TYPE.frame);
    board.removeMarkers(MARKER_TYPE.square);
    const lastMove = chess.history({ verbose: true }).at(-1);
    if (lastMove) {
      board.addMarker(MARKER_TYPE.square, lastMove.from);
      board.addMarker(MARKER_TYPE.square, lastMove.to);
    }
    if (chess.inCheck()) {
      const kingSquare = findKing(chess, turn);
      if (kingSquare) board.addMarker(MARKER_TYPE.frame, kingSquare);
    }
  }, [boardKey, chess, fen, turn]);

  useEffect(() => {
    const board = boardRef.current;
    if (board && board.getOrientation() !== orientation) board.setOrientation(orientation, true);
  }, [boardKey, orientation]);

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    board.disableMoveInput();
    if (!canMove) return;
    board.enableMoveInput((event) => handleMoveInput(event, chess, onMoveRef), turn);
  }, [boardKey, canMove, chess, fen, turn]);

  const theme = BOARD_THEMES.find((item) => item.id === appearance.boardTheme) ?? BOARD_THEMES[0];
  return <div className="board-frame" style={{ "--board-light": theme.light, "--board-dark": theme.dark }}><div ref={containerRef} className="chessboard-root" /></div>;
}

function handleMoveInput(event, chess, onMoveRef) {
  const board = event.chessboard;
  board.removeMarkers(MARKER_TYPE.dot);
  board.removeMarkers(MARKER_TYPE.circle);
  if (event.type === INPUT_EVENT_TYPE.moveInputStarted) {
    const moves = chess.moves({ square: event.square, verbose: true });
    const destinations = new Map();
    moves.forEach((move) => destinations.set(move.to, Boolean(move.captured)));
    destinations.forEach((captured, square) => board.addMarker(captured ? MARKER_TYPE.circle : MARKER_TYPE.dot, square));
    return moves.length > 0;
  }
  if (event.type === INPUT_EVENT_TYPE.validateMoveInput) {
    return onMoveRef.current({ from: event.squareFrom, to: event.squareTo });
  }
  return true;
}

function findKing(chess, color) {
  const files = "abcdefgh";
  for (const file of files) {
    for (let rank = 1; rank <= 8; rank += 1) {
      const square = `${file}${rank}`;
      const piece = chess.get(square);
      if (piece?.type === "k" && piece.color === color) return square;
    }
  }
  return null;
}
