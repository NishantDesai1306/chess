import { X } from "lucide-react";

const PIECES = {
  w: [{ id: "q", glyph: "♕", name: "Queen" }, { id: "r", glyph: "♖", name: "Rook" }, { id: "b", glyph: "♗", name: "Bishop" }, { id: "n", glyph: "♘", name: "Knight" }],
  b: [{ id: "q", glyph: "♛", name: "Queen" }, { id: "r", glyph: "♜", name: "Rook" }, { id: "b", glyph: "♝", name: "Bishop" }, { id: "n", glyph: "♞", name: "Knight" }],
};

export function PromotionDialog({ color, onChoose, onClose }) {
  return <div className="modal-backdrop"><div className="promotion-dialog" role="dialog" aria-modal="true" aria-labelledby="promotion-title"><button className="icon-button promotion-close" aria-label="Cancel promotion" onClick={onClose}><X size={18} /></button><p className="eyebrow">Final rank</p><h2 id="promotion-title">Choose a piece</h2><div className="promotion-options">{PIECES[color].map((piece) => <button key={piece.id} onClick={() => onChoose(piece.id)}><span>{piece.glyph}</span><small>{piece.name}</small></button>)}</div></div></div>;
}
