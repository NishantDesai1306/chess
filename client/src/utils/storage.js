import { BORDER_TYPE } from "cm-chessboard/src/cm-chessboard/Chessboard";

export const KEYS = {
  BOARD: "BOARD",
  PIECE: "PIECE",
  FRAME: "FRAME",
  COORDINATES: "COORDINATES",
};

export const DEFAULT_BOARD_STYLE = "brown";
export const DEFAULT_PIECE_SET = "/assets/images/pieces.svg";
export const DEFAULT_FRAME = BORDER_TYPE.none;
export const DEFAULT_COORDINATES = true;

export function setBoardStyle(boardStyle) {
  localStorage.setItem(KEYS.BOARD, boardStyle);
}
export function getBoardStyle() {
  const storedValue = localStorage.getItem(KEYS.BOARD);
  return storedValue || DEFAULT_BOARD_STYLE
}

export function setPieceStyle(boardStyle) {
  localStorage.setItem(KEYS.PIECE, boardStyle);
}
export function getPieceStyle() {
  const storedValue = localStorage.getItem(KEYS.PIECE);
  return storedValue || DEFAULT_PIECE_SET;
}

export function setFrameStyle(frameStyle) {
  localStorage.setItem(KEYS.FRAME, frameStyle);
}
export function getFrameStyle() {
  const storedValue = localStorage.getItem(KEYS.FRAME);
  return storedValue || DEFAULT_FRAME;
}

export function setCoordinateStatus(coordinateStatus) {
  localStorage.setItem(KEYS.COORDINATES, coordinateStatus);
}
export function getCoordinateStatus() {
  const storedValue = localStorage.getItem(KEYS.COORDINATES);
  return storedValue ? storedValue === "true" : DEFAULT_FRAME;
}