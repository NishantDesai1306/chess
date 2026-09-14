import { useRef, useState } from "react";
import { animated, useSpring } from "@react-spring/web";
import { Bot, ChevronDown, FileText, Sparkles, UserRound } from "lucide-react";
import { Chess, validateFen } from "chess.js";
import { DEFAULT_FEN, PLAYER } from "../game/constants.js";

const SIDES = [
  { color: "w", name: "White" },
  { color: "b", name: "Black" },
];

export function SetupScreen({ appearance, onStart }) {
  const [players, setPlayers] = useState({ w: PLAYER.HUMAN, b: PLAYER.COMPUTER });
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [fen, setFen] = useState("");
  const [pgn, setPgn] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef(null);
  const entrance = useSpring({ from: { opacity: 0, y: 24 }, to: { opacity: 1, y: 0 } });

  function updatePlayer(color, type) {
    setPlayers((current) => ({ ...current, [color]: type }));
  }

  function handleStart() {
    try {
      const chess = new Chess();
      if (pgn.trim()) chess.loadPgn(pgn.trim());
      else if (fen.trim()) {
        const result = validateFen(fen.trim());
        if (!result.ok) throw new Error(result.error);
        chess.load(fen.trim());
      } else chess.load(DEFAULT_FEN);

      setError("");
      onStart({
        id: crypto.randomUUID(),
        pgn: chess.pgn(),
        startingFen: chess.getHeaders().FEN ?? DEFAULT_FEN,
        players,
        orientation: "w",
        appearance,
        outcome: null,
      });
    } catch {
      setError(pgn.trim() ? "That PGN could not be read." : "That FEN position is not valid.");
    }
  }

  async function handlePgnFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setPgn(await file.text());
    setFen("");
    setError("");
  }

  return (
    <main className="setup-page">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <animated.section className="setup-shell" style={entrance}>
        <div className="setup-story">
          <header className="brand"><span className="brand-mark">♞</span><span>Chess</span></header>
          <div className="story-copy">
            <p className="eyebrow">A private room for the next move</p>
            <h1>Set the board.<br /><em>Find your line.</em></h1>
            <p className="lede">Play across the table or test your ideas against Stockfish—quietly, locally, and at your own pace.</p>
          </div>
          <StudyBoard />
          <p className="local-note"><Sparkles size={14} /> Analysis stays on this device</p>
        </div>

        <div className="setup-panel">
          <div className="panel-heading">
            <p className="eyebrow">New game</p>
            <h2>Choose your seats</h2>
          </div>

          <div className="player-picks">
            {SIDES.map(({ color, name }) => (
              <fieldset className="player-pick" key={color}>
                <legend><span className={`side-piece side-piece-${color}`}>♟</span>{name}</legend>
                <div className="segmented-control">
                  <PlayerButton active={players[color] === PLAYER.HUMAN} icon={UserRound} label="Human" onClick={() => updatePlayer(color, PLAYER.HUMAN)} />
                  <PlayerButton active={players[color] === PLAYER.COMPUTER} icon={Bot} label="Computer" onClick={() => updatePlayer(color, PLAYER.COMPUTER)} />
                </div>
              </fieldset>
            ))}
          </div>

          <button className="primary-button start-button" onClick={handleStart}>Begin game <span>→</span></button>

          <button className="advanced-toggle" aria-expanded={advancedOpen} onClick={() => setAdvancedOpen((open) => !open)}>
            <span><FileText size={16} /> Start from a position</span>
            <ChevronDown size={16} className={advancedOpen ? "rotated" : ""} />
          </button>

          {advancedOpen ? (
            <div className="advanced-fields">
              <label htmlFor="fen">FEN</label>
              <textarea id="fen" rows="2" value={fen} onChange={(event) => { setFen(event.target.value); setPgn(""); setError(""); }} placeholder={DEFAULT_FEN} />
              <div className="field-divider"><span>or</span></div>
              <input ref={fileRef} hidden type="file" accept=".pgn,text/plain" onChange={handlePgnFile} />
              <button className="secondary-button" onClick={() => fileRef.current?.click()}>{pgn ? "PGN loaded" : "Choose a PGN file"}</button>
            </div>
          ) : null}
          {error ? <p className="form-error" role="alert">{error}</p> : null}
        </div>
      </animated.section>
    </main>
  );
}

function PlayerButton({ active, icon: Icon, label, onClick }) {
  return <button type="button" className={active ? "player-button active" : "player-button"} aria-pressed={active} onClick={onClick}><Icon size={17} />{label}</button>;
}

function StudyBoard() {
  const pieces = ["♜", "♞", "♝", "♛", "♚", "♝", "♞", "♜", "♟", "♟", "♟", "♟", "♟", "♟", "♟", "♟", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "♙", "", "", "", "", "", "", "", "", "", "", "", "", "♙", "♙", "♙", "", "♙", "♙", "♙", "♙", "♖", "♘", "♗", "♕", "♔", "♗", "♘", "♖"];
  return <div className="study-board" aria-hidden="true">{pieces.map((piece, index) => <span key={`${index}-${piece}`}>{piece}</span>)}</div>;
}
