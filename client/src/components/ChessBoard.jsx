import { useEffect, useRef } from "react";
import { Chessboard, INPUT_EVENT_TYPE, MARKER_TYPE } from "cm-chessboard";
import { Arrows, ARROW_TYPE } from "cm-chessboard/src/cm-chessboard/extensions/arrows/Arrows.js";
import { BOARD_THEMES, PIECE_SETS } from "../utils/storage.js";

export function ChessBoard({ chess, fen, turn, orientation, appearance, canMove, onMove, lastMove, suggestedMove, hintSquare }) {
  const containerRef = useRef(null);
  const boardRef = useRef(null);
  const onMoveRef = useRef(onMove);
  const arrowsRef = useRef([]);
  const arrowStartRef = useRef(null);
  const arrowPointerDownRef = useRef(null);
  const boardKey = `${appearance.boardTheme}:${appearance.pieceSet}:${appearance.coordinates}`;

  useEffect(() => { onMoveRef.current = onMove; }, [onMove]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    const suppressContextMenu = (event) => event.preventDefault();
    container.addEventListener("contextmenu", suppressContextMenu);
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
    const handleArrowPointerDown = (event) => {
      if (event.button !== 2) {
        arrowStartRef.current = null;
        return;
      }
      arrowPointerDownRef.current = getEventSquare(event);
    };
    const handleArrowPointerUp = (event) => {
      if (event.button !== 2) return;
      const pointerDownSquare = arrowPointerDownRef.current;
      const pointerUpSquare = getEventSquare(event);
      arrowPointerDownRef.current = null;
      if (!pointerUpSquare) {
        arrowStartRef.current = null;
        return;
      }

      if (pointerDownSquare && pointerDownSquare !== pointerUpSquare) {
        arrowStartRef.current = null;
        toggleArrow(board, arrowsRef, pointerDownSquare, pointerUpSquare);
        return;
      }

      if (!arrowStartRef.current) {
        arrowStartRef.current = pointerUpSquare;
        return;
      }
      const from = arrowStartRef.current;
      arrowStartRef.current = null;
      if (from !== pointerUpSquare) toggleArrow(board, arrowsRef, from, pointerUpSquare);
    };
    container.addEventListener("mousedown", handleArrowPointerDown);
    container.addEventListener("mouseup", handleArrowPointerUp);
    boardRef.current = board;
    return () => {
      container.removeEventListener("contextmenu", suppressContextMenu);
      container.removeEventListener("mousedown", handleArrowPointerDown);
      container.removeEventListener("mouseup", handleArrowPointerUp);
      arrowStartRef.current = null;
      arrowPointerDownRef.current = null;
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
    const highlightedMove = lastMove ?? chess.history({ verbose: true }).at(-1);
    if (highlightedMove) {
      board.addMarker(MARKER_TYPE.square, highlightedMove.from);
      board.addMarker(MARKER_TYPE.square, highlightedMove.to);
    }
    if (chess.inCheck()) {
      const kingSquare = findKing(chess, turn);
      if (kingSquare) board.addMarker(MARKER_TYPE.frame, kingSquare);
    }
  }, [boardKey, chess, fen, lastMove, turn]);

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    board.removeArrows(ARROW_TYPE.default);
    if (suggestedMove) board.addArrow(ARROW_TYPE.default, suggestedMove.from, suggestedMove.to);
  }, [boardKey, suggestedMove]);

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    board.removeMarkers(MARKER_TYPE.circle);
    if (hintSquare) board.addMarker(MARKER_TYPE.circle, hintSquare);
  }, [boardKey, hintSquare]);

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

function getEventSquare(event) {
  return event.target.closest?.("[data-square]")?.getAttribute("data-square") ?? null;
}

function toggleArrow(board, arrowsRef, from, to) {
  const existing = arrowsRef.current.findIndex((arrow) =>
    (arrow.from === from && arrow.to === to) || (arrow.from === to && arrow.to === from));
  if (existing >= 0) {
    const arrow = arrowsRef.current[existing];
    board.removeArrows(ARROW_TYPE.default, arrow.from, arrow.to);
    arrowsRef.current.splice(existing, 1);
    return;
  }
  board.addArrow(ARROW_TYPE.default, from, to);
  arrowsRef.current.push({ from, to });
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
    const move = { from: event.squareFrom, to: event.squareTo };
    const candidates = chess.moves({ square: move.from, verbose: true }).filter((candidate) => candidate.to === move.to);
    if (candidates.length === 0) return false;

    // Promotion needs a choice before the visual move can be accepted. Normal
    // moves are committed after cm-chessboard has completed its own drop state;
    // updating React/chess.js inside this validation callback can interrupt that
    // state transition and leave the board SVG empty.
    if (candidates.some((candidate) => candidate.promotion)) {
      onMoveRef.current(move);
      return false;
    }

    const inputProcess = board.state?.moveInputProcess;
    if (inputProcess && typeof inputProcess.then === "function") {
      inputProcess.then((accepted) => {
        if (accepted) onMoveRef.current(move);
      });
    } else {
      queueMicrotask(() => onMoveRef.current(move));
    }
    return true;
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
