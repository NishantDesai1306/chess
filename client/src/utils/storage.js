export const SESSION_VERSION = 2;

const SESSION_KEY = "chess.session";
const APPEARANCE_KEY = "chess.appearance";

export const BOARD_THEMES = [
  { id: "study", name: "The Study", note: "Quiet slate and old paper", light: "#d9d2c2", dark: "#52666a" },
  { id: "walnut", name: "Walnut Room", note: "Warm wood and parchment", light: "#e0c9a9", dark: "#855d46" },
  { id: "midnight", name: "Midnight", note: "Cool silver and deep blue", light: "#bdc7c9", dark: "#334b60" },
];

export const PIECE_SETS = [
  { id: "classic", name: "Classic", url: "/assets/images/pieces.svg" },
  { id: "staunty", name: "Staunton", url: "/assets/images/pieces-staunty.svg" },
];

export const DEFAULT_APPEARANCE = { boardTheme: "study", pieceSet: "classic", coordinates: true };

export function getAppearance() {
  return readJson(APPEARANCE_KEY, DEFAULT_APPEARANCE, (value) => ({
    boardTheme: BOARD_THEMES.some((theme) => theme.id === value?.boardTheme) ? value.boardTheme : DEFAULT_APPEARANCE.boardTheme,
    pieceSet: PIECE_SETS.some((set) => set.id === value?.pieceSet) ? value.pieceSet : DEFAULT_APPEARANCE.pieceSet,
    coordinates: typeof value?.coordinates === "boolean" ? value.coordinates : DEFAULT_APPEARANCE.coordinates,
  }));
}

export function saveAppearance(appearance) {
  localStorage.setItem(APPEARANCE_KEY, JSON.stringify(appearance));
}

export function getSavedSession() {
  return readJson(SESSION_KEY, null, (value) => {
    if (value?.version !== SESSION_VERSION || typeof value.pgn !== "string" || !value.players) return null;
    return value;
  });
}

export function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ ...session, version: SESSION_VERSION }));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function readJson(key, fallback, normalize) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? normalize(JSON.parse(raw)) : fallback;
  } catch {
    localStorage.removeItem(key);
    return fallback;
  }
}
