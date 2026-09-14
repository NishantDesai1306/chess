import { Check, X } from "lucide-react";
import { BOARD_THEMES, PIECE_SETS } from "../utils/storage.js";

export function AppearancePanel({ appearance, onChange, onClose }) {
  function update(key, value) {
    onChange({ ...appearance, [key]: value });
  }
  return (
    <div className="sheet-backdrop" role="presentation" onMouseDown={onClose}>
      <aside className="appearance-sheet" role="dialog" aria-modal="true" aria-labelledby="appearance-title" onMouseDown={(event) => event.stopPropagation()}>
        <header><div><p className="eyebrow">Board room</p><h2 id="appearance-title">Appearance</h2></div><button className="icon-button" aria-label="Close appearance" onClick={onClose}><X size={19} /></button></header>
        <section><h3>Board</h3><div className="theme-list">{BOARD_THEMES.map((theme) => (
          <button key={theme.id} className={appearance.boardTheme === theme.id ? "theme-option selected" : "theme-option"} onClick={() => update("boardTheme", theme.id)}>
            <span className="swatch"><i style={{ background: theme.light }} /><i style={{ background: theme.dark }} /></span>
            <span><strong>{theme.name}</strong><small>{theme.note}</small></span>
            {appearance.boardTheme === theme.id ? <Check size={17} /> : null}
          </button>
        ))}</div></section>
        <section><h3>Pieces</h3><div className="piece-options">{PIECE_SETS.map((set) => <button key={set.id} className={appearance.pieceSet === set.id ? "piece-option selected" : "piece-option"} onClick={() => update("pieceSet", set.id)}><span>♞</span>{set.name}</button>)}</div></section>
        <label className="coordinate-toggle"><span><strong>Coordinates</strong><small>Show ranks and files</small></span><input type="checkbox" checked={appearance.coordinates} onChange={(event) => update("coordinates", event.target.checked)} /></label>
      </aside>
    </div>
  );
}
