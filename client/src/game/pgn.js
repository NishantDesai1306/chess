import { Chess } from "chess.js";
import { getEngineLevel } from "../engine/levels.js";
import { DEFAULT_FEN, PLAYER } from "./constants.js";

const VALID_RESULTS = new Set(["1-0", "0-1", "1/2-1/2", "*"]);

export function createExportPgn({ pgn, startingFen, players, engineSkill, outcome, date = new Date() }) {
  const chess = new Chess();

  if (pgn?.trim()) chess.loadPgn(pgn);
  else chess.load(startingFen ?? DEFAULT_FEN);

  const headers = chess.getHeaders();
  setMissingHeader(chess, headers, "Event", "Casual Game");
  setMissingHeader(chess, headers, "Site", "Chess — Local Study");
  setMissingHeader(chess, headers, "Date", formatPgnDate(date));
  setMissingHeader(chess, headers, "White", getPlayerName(players?.w, "White", engineSkill));
  setMissingHeader(chess, headers, "Black", getPlayerName(players?.b, "Black", engineSkill));

  const appResult = getOutcomeResult(outcome);
  const retainedResult = VALID_RESULTS.has(headers.Result) ? headers.Result : "*";
  chess.setHeader("Result", appResult ?? retainedResult);

  return chess.pgn({ maxWidth: 88, newline: "\n" });
}

export function createPgnFilename(date = new Date()) {
  const day = [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((part, index) => index === 0 ? String(part) : String(part).padStart(2, "0"))
    .join("-");
  return `chess-game-${day}.pgn`;
}

export async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const field = document.createElement("textarea");
  field.value = text;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.append(field);
  field.select();
  const copied = document.execCommand("copy");
  field.remove();
  if (!copied) throw new Error("Clipboard access is unavailable.");
}

export function downloadPgn(pgn, filename = createPgnFilename()) {
  const url = URL.createObjectURL(new Blob([pgn], { type: "application/x-chess-pgn;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function setMissingHeader(chess, headers, key, value) {
  if (!headers[key]) chess.setHeader(key, value);
}

function getPlayerName(player, color, engineSkill) {
  if (player !== PLAYER.COMPUTER) return `${color} Player`;
  const level = getEngineLevel(engineSkill);
  return `Stockfish · Level ${level.value}`;
}

function getOutcomeResult(outcome) {
  if (!outcome) return null;
  if (outcome.winner === "w") return "1-0";
  if (outcome.winner === "b") return "0-1";
  return "1/2-1/2";
}

function formatPgnDate(date) {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((part, index) => index === 0 ? String(part) : String(part).padStart(2, "0"))
    .join(".");
}
