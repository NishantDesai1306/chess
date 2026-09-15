import { useEffect, useState } from "react";
import { animated, useSpring } from "@react-spring/web";
import {
  ArrowDownUp,
  Bot,
  Clipboard,
  Flag,
  Palette,
  RotateCcw,
  Settings2,
  Undo2,
  UserRound,
} from "lucide-react";
import { ChessBoard } from "./ChessBoard.jsx";
import { EvaluationBar } from "./EvaluationBar.jsx";
import { MoveHistory } from "./MoveHistory.jsx";
import { AppearancePanel } from "./AppearancePanel.jsx";
import { PromotionDialog } from "./PromotionDialog.jsx";
import { GameOverOverlay } from "./GameOverOverlay.jsx";
import { COLOR_NAME, PLAYER } from "../game/constants.js";
import { useGameController } from "../hooks/useGameController.js";

export function GameScreen({ session, appearance, onAppearanceChange, onSessionChange, onNewGame }) {
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [outcomeDismissed, setOutcomeDismissed] = useState(false);
  const game = useGameController({ session, onSessionChange });
  const entrance = useSpring({ from: { opacity: 0, scale: 0.965, y: 16 }, to: { opacity: 1, scale: 1, y: 0 }, config: { tension: 120, friction: 22 } });
  const topColor = game.orientation === "w" ? "b" : "w";
  const bottomColor = game.orientation;
  const showGameOver = Boolean(game.outcome) && !outcomeDismissed;

  useEffect(() => {
    if (!game.outcome) setOutcomeDismissed(false);
  }, [game.outcome]);

  function handleUndo() {
    setOutcomeDismissed(false);
    game.undo();
  }

  function handleRestart() {
    setOutcomeDismissed(false);
    game.restart();
  }

  return (
    <main className="game-page">
      <div className="ambient ambient-game" />
      <header className="game-header">
        <div className="brand"><span className="brand-mark">♞</span><span>Chess</span></div>
        <div className="game-header-meta"><span>Local match</span><i /> <span>Depth 15</span></div>
        <button className="header-new-game" onClick={onNewGame}>New game <span>↗</span></button>
      </header>

      <section className="game-workspace">
        <animated.div className="board-column" style={entrance}>
          <PlayerStrip color={topColor} type={session.players[topColor]} active={game.turn === topColor && !game.outcome} thinking={game.turn === topColor && game.engineStatus.phase === "thinking" && session.players[topColor] === PLAYER.COMPUTER} />
          <div className="board-and-eval">
            <EvaluationBar evaluation={game.evaluation} orientation={game.orientation} />
            <ChessBoard chess={game.chess} fen={game.fen} turn={game.turn} orientation={game.orientation} appearance={appearance} canMove={game.canMove} onMove={game.requestMove} />
          </div>
          <PlayerStrip color={bottomColor} type={session.players[bottomColor]} active={game.turn === bottomColor && !game.outcome} thinking={game.turn === bottomColor && game.engineStatus.phase === "thinking" && session.players[bottomColor] === PLAYER.COMPUTER} />
        </animated.div>

        <aside className="match-rail">
          <header className="rail-heading"><div><p className="eyebrow">Current game</p><h1>{game.outcome ? "Game complete" : game.chess.inCheck() ? "King in check" : `${COLOR_NAME[game.turn]} to move`}</h1></div><span className={game.chess.inCheck() ? "turn-orb danger" : "turn-orb"} /></header>
          <EngineStatus status={game.engineStatus} onRetry={game.retryEngine} />
          <section className="notation"><header><h2>Notation</h2><span>{game.history.length} ply</span></header><MoveHistory history={game.history} /></section>
          <div className="game-controls">
            <button onClick={handleUndo} disabled={game.history.length === 0}><Undo2 size={18} /><span>Undo</span></button>
            <button onClick={handleRestart}><RotateCcw size={18} /><span>Restart</span></button>
            <button onClick={game.flip}><ArrowDownUp size={18} /><span>Flip</span></button>
            <button onClick={game.copyFen}><Clipboard size={18} /><span>Copy FEN</span></button>
            <button onClick={() => setAppearanceOpen(true)}><Palette size={18} /><span>Appearance</span></button>
            <button className="resign-control" onClick={game.resign} disabled={Boolean(game.outcome)}><Flag size={18} /><span>Resign</span></button>
          </div>
          <footer className="rail-footer"><Settings2 size={14} /><span>Right-click two squares to draw an arrow</span></footer>
        </aside>
      </section>

      {appearanceOpen ? <AppearancePanel appearance={appearance} onChange={onAppearanceChange} onClose={() => setAppearanceOpen(false)} /> : null}
      {game.pendingPromotion ? <PromotionDialog color={game.pendingPromotion.color} onChoose={game.choosePromotion} onClose={game.cancelPromotion} /> : null}
      {showGameOver ? (
        <GameOverOverlay
          outcome={game.outcome}
          canUndo={game.history.length > 0}
          onUndo={handleUndo}
          onDismiss={() => setOutcomeDismissed(true)}
          onRestart={handleRestart}
          onNewGame={onNewGame}
        />
      ) : null}
      {game.toast ? <div className="toast" role="status">{game.toast}</div> : null}
    </main>
  );
}

function PlayerStrip({ color, type, active, thinking }) {
  const Icon = type === PLAYER.COMPUTER ? Bot : UserRound;
  return <div className={active ? "player-strip active" : "player-strip"}><div className={`player-avatar avatar-${color}`}><Icon size={18} /></div><div><strong>{type === PLAYER.COMPUTER ? "Stockfish" : `${COLOR_NAME[color]} player`}</strong><span>{type === PLAYER.COMPUTER ? "Computer" : "At the board"}</span></div><div className="player-state">{thinking ? <><i className="thinking-dot" />Thinking</> : active ? "To move" : "Waiting"}</div></div>;
}

function EngineStatus({ status, onRetry }) {
  if (status.phase === "error") {
    return <div className="engine-status engine-error"><div><strong>Engine unavailable</strong><span>{status.message}</span></div><button onClick={onRetry}>Retry</button></div>;
  }
  if (status.phase === "loading") {
    const percent = Math.round((status.progress ?? 0) * 100);
    return <div className="engine-status"><div><strong>Preparing Stockfish</strong><span>{percent > 0 ? `${percent}% downloaded` : "Loading local engine…"}</span></div><div className="engine-progress"><i style={{ width: `${percent}%` }} /></div></div>;
  }
  return <div className="engine-status"><div><strong>{status.phase === "thinking" ? "Studying the position" : "Stockfish ready"}</strong><span>Running locally in your browser</span></div><span className={status.phase === "thinking" ? "engine-pulse active" : "engine-pulse"} /></div>;
}
