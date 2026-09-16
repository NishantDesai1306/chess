export const OPENINGS = [
  ["A00", "Van't Kruijs Opening", ["e3"]],
  ["A02", "Bird Opening", ["f4"]],
  ["A04", "Réti Opening", ["Nf3"]],
  ["A10", "English Opening", ["c4"]],
  ["A40", "Queen's Pawn Opening", ["d4"]],
  ["A45", "Trompowsky Attack", ["d4", "Nf6", "Bg5"]],
  ["A46", "Torre Attack", ["d4", "Nf6", "Nf3", "e6", "Bg5"]],
  ["A56", "Benoni Defense", ["d4", "Nf6", "c4", "c5", "d5"]],
  ["A57", "Benko Gambit", ["d4", "Nf6", "c4", "c5", "d5", "b5"]],
  ["A80", "Dutch Defense", ["d4", "f5"]],
  ["B00", "King's Pawn Opening", ["e4"]],
  ["B01", "Scandinavian Defense", ["e4", "d5"]],
  ["B02", "Alekhine Defense", ["e4", "Nf6"]],
  ["B06", "Modern Defense", ["e4", "g6"]],
  ["B07", "Pirc Defense", ["e4", "d6"]],
  ["B10", "Caro-Kann Defense", ["e4", "c6"]],
  ["B12", "Caro-Kann: Advance Variation", ["e4", "c6", "d4", "d5", "e5"]],
  ["B20", "Sicilian Defense", ["e4", "c5"]],
  ["B22", "Sicilian: Alapin Variation", ["e4", "c5", "c3"]],
  ["B23", "Sicilian: Closed Variation", ["e4", "c5", "Nc3"]],
  ["B27", "Sicilian: Hyperaccelerated Dragon", ["e4", "c5", "Nf3", "g6"]],
  ["B30", "Sicilian: Rossolimo Attack", ["e4", "c5", "Nf3", "Nc6", "Bb5"]],
  ["B50", "Sicilian: Modern Variations", ["e4", "c5", "Nf3", "d6"]],
  ["B90", "Sicilian: Najdorf Variation", ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6"]],
  ["C00", "French Defense", ["e4", "e6"]],
  ["C02", "French: Advance Variation", ["e4", "e6", "d4", "d5", "e5"]],
  ["C20", "King's Pawn Game", ["e4", "e5"]],
  ["C21", "Danish Gambit", ["e4", "e5", "d4", "exd4", "c3"]],
  ["C23", "Bishop's Opening", ["e4", "e5", "Bc4"]],
  ["C25", "Vienna Game", ["e4", "e5", "Nc3"]],
  ["C40", "King's Knight Opening", ["e4", "e5", "Nf3"]],
  ["C41", "Philidor Defense", ["e4", "e5", "Nf3", "d6"]],
  ["C42", "Petrov's Defense", ["e4", "e5", "Nf3", "Nf6"]],
  ["C44", "Scotch Game", ["e4", "e5", "Nf3", "Nc6", "d4"]],
  ["C50", "Italian Game", ["e4", "e5", "Nf3", "Nc6", "Bc4"]],
  ["C54", "Italian: Giuoco Piano", ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5"]],
  ["C55", "Italian: Two Knights Defense", ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6"]],
  ["C60", "Ruy López", ["e4", "e5", "Nf3", "Nc6", "Bb5"]],
  ["C65", "Ruy López: Berlin Defense", ["e4", "e5", "Nf3", "Nc6", "Bb5", "Nf6"]],
  ["D00", "London System", ["d4", "d5", "Nf3", "Nf6", "Bf4"]],
  ["D06", "Queen's Gambit Declined", ["d4", "d5", "c4", "e6"]],
  ["D10", "Slav Defense", ["d4", "d5", "c4", "c6"]],
  ["D20", "Queen's Gambit Accepted", ["d4", "d5", "c4", "dxc4"]],
  ["D35", "Queen's Gambit Declined: Exchange", ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "cxd5", "exd5"]],
  ["D70", "Grünfeld Defense", ["d4", "Nf6", "c4", "g6", "Nc3", "d5"]],
  ["E00", "Catalan Opening", ["d4", "Nf6", "c4", "e6", "g3"]],
  ["E12", "Queen's Indian Defense", ["d4", "Nf6", "c4", "e6", "Nf3", "b6"]],
  ["E20", "Nimzo-Indian Defense", ["d4", "Nf6", "c4", "e6", "Nc3", "Bb4"]],
  ["E60", "King's Indian Defense", ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7"]],
].map(([eco, name, moves]) => ({ eco, name, moves }));

export function recognizeOpening(history) {
  const sanMoves = history.map((move) => typeof move === "string" ? move : move.san);
  let match = null;
  for (const opening of OPENINGS) {
    if (opening.moves.length > sanMoves.length || opening.moves.length <= (match?.moves.length ?? 0)) continue;
    if (opening.moves.every((move, index) => normalizeSan(move) === normalizeSan(sanMoves[index]))) match = opening;
  }
  return match;
}

function normalizeSan(move = "") {
  return move.replace(/[+#?!]+$/g, "");
}
