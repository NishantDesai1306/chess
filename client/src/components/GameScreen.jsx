import { useEffect, useMemo, useState } from "react";
import { Chess } from "chess.js";
import { animated, useSpring } from "@react-spring/web";
import {
  ArrowDownUp,
  Bot,
  Command,
  Flag,
  Lightbulb,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  Palette,
  Plus,
  Radio,
  RotateCcw,
  ScanSearch,
  Settings2,
  Share2,
  Undo2,
  UserRound,
} from "lucide-react";
import { ChessBoard } from "./ChessBoard.jsx";
import { EvaluationBar } from "./EvaluationBar.jsx";
import { MoveHistory } from "./MoveHistory.jsx";
import { AppearancePanel } from "./AppearancePanel.jsx";
import { PromotionDialog } from "./PromotionDialog.jsx";
import { GameOverOverlay } from "./GameOverOverlay.jsx";
import { EnginePanel } from "./EnginePanel.jsx";
import { GameReview } from "./GameReview.jsx";
import { ShareGameDialog } from "./ShareGameDialog.jsx";
import { GameCommandMenu } from "./GameCommandMenu.jsx";
import { ConfirmActionDialog } from "./ConfirmActionDialog.jsx";
import { HintPanel } from "./HintPanel.jsx";
import { COLOR_NAME, PLAYER } from "../game/constants.js";
import { getEngineLevel } from "../engine/levels.js";
import { recognizeOpening } from "../data/openings.js";
import { createReviewGame } from "../game/review.js";
import { createPositionHint } from "../game/hints.js";
import { useGameController } from "../hooks/useGameController.js";

export function GameScreen({ session, appearance, onAppearanceChange, onSessionChange, onNewGame }) {
  const [activePanel, setActivePanel] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [outcomeDismissed, setOutcomeDismissed] = useState(false);
  const [zenMode, setZenMode] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [historyCursor, setHistoryCursor] = useState(null);
  const [hintState, setHintState] = useState(null);
  const game = useGameController({ session, onSessionChange });
  const historyGame = useMemo(() => createReviewGame(session.startingFen, game.history), [game.fen, game.history.length, session.startingFen]);
  const displayCursor = historyCursor == null ? game.history.length : Math.min(historyCursor, game.history.length);
  const isLivePosition = displayCursor === game.history.length;
  const displayFen = historyGame.positions[displayCursor] ?? game.fen;
  const historicalChess = useMemo(() => new Chess(displayFen), [displayFen]);
  const displayChess = isLivePosition ? game.chess : historicalChess;
  const displayTurn = displayChess.turn();
  const displayMove = displayCursor > 0 ? historyGame.moves[displayCursor - 1] : null;
  const entrance = useSpring({ from: { opacity: 0, scale: 0.965, y: 16 }, to: { opacity: 1, scale: 1, y: 0 }, config: { tension: 120, friction: 22 } });
  const topColor = game.orientation === "w" ? "b" : "w";
  const bottomColor = game.orientation;
  const showGameOver = Boolean(game.outcome) && !outcomeDismissed;
  const inCheck = displayChess.inCheck();
  const pageClassName = `game-page${zenMode ? " zen-mode" : ""}${inCheck ? " is-check" : ""}`;
  const opening = recognizeOpening(game.history.slice(0, displayCursor));
  const hint = useMemo(() => createPositionHint(game.fen, game.currentAnalysis), [game.currentAnalysis, game.fen]);
  const hintStage = hintState?.fen === game.fen ? hintState.stage : 0;
  const visibleHintStage = isLivePosition ? hintStage : 0;
  const canRequestHint = isLivePosition && game.canMove && !game.outcome;
  const overlayOpen = activePanel !== null || pendingAction !== null;
  const confirmation = getConfirmation(pendingAction);

  useEffect(() => {
    if (!game.outcome) setOutcomeDismissed(false);
  }, [game.outcome]);

  useEffect(() => {
    function handleGameShortcut(event) {
      if (event.defaultPrevented || event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
      if (isEditableTarget(event.target)) return;
      if (event.key === "Escape" && zenMode) {
        setZenMode(false);
        return;
      }
      if (overlayOpen || reviewMode || game.pendingPromotion || showGameOver) return;
      const key = event.key.toLowerCase();
      if (key === "z") setZenMode((current) => !current);
      else if (key === "u" && game.history.length > 0) handleUndo();
      else if (key === "f") game.flip();
      else if (key === "h" && canRequestHint) handleHintRequest();
      else return;
      event.preventDefault();
    }
    window.addEventListener("keydown", handleGameShortcut);
    return () => window.removeEventListener("keydown", handleGameShortcut);
  }, [canRequestHint, game, overlayOpen, reviewMode, showGameOver, zenMode]);

  useEffect(() => {
    function handleCommandShortcut(event) {
      if (event.defaultPrevented || event.repeat || !(event.metaKey || event.ctrlKey) || event.altKey || event.key.toLowerCase() !== "k") return;
      if (reviewMode || game.pendingPromotion || showGameOver || pendingAction) return;
      event.preventDefault();
      setActivePanel((current) => current === "commands" ? null : "commands");
    }
    window.addEventListener("keydown", handleCommandShortcut);
    return () => window.removeEventListener("keydown", handleCommandShortcut);
  }, [game.pendingPromotion, pendingAction, reviewMode, showGameOver]);

  useEffect(() => {
    function handleOverlayEscape(event) {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      if (pendingAction) setPendingAction(null);
      else if (activePanel) setActivePanel(null);
    }
    window.addEventListener("keydown", handleOverlayEscape);
    return () => window.removeEventListener("keydown", handleOverlayEscape);
  }, [activePanel, pendingAction]);

  useEffect(() => {
    function handleHistoryNavigation(event) {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || isEditableTarget(event.target)) return;
      if (overlayOpen || reviewMode || zenMode || showGameOver || game.history.length === 0) return;
      if (event.key === "ArrowLeft") setHistoryCursor((current) => current == null ? game.history.length - 1 : Math.max(0, current - 1));
      else if (event.key === "ArrowRight") setHistoryCursor((current) => current == null || current >= game.history.length - 1 ? null : current + 1);
      else if (event.key === "Home") setHistoryCursor(0);
      else if (event.key === "End") setHistoryCursor(null);
      else return;
      event.preventDefault();
    }
    window.addEventListener("keydown", handleHistoryNavigation);
    return () => window.removeEventListener("keydown", handleHistoryNavigation);
  }, [game.history.length, overlayOpen, reviewMode, showGameOver, zenMode]);

  function handleUndo() {
    setHintState(null);
    setOutcomeDismissed(false);
    setHistoryCursor(null);
    game.undo();
  }

  function handleRestart() {
    setActivePanel(null);
    setPendingAction(null);
    setOutcomeDismissed(false);
    setReviewMode(false);
    setHistoryCursor(null);
    setHintState(null);
    game.restart();
  }

  function handleReview() {
    setActivePanel(null);
    setOutcomeDismissed(true);
    setZenMode(false);
    setHistoryCursor(null);
    setHintState(null);
    setReviewMode(true);
  }

  function handleFinishReview() {
    setReviewMode(false);
    setOutcomeDismissed(true);
  }

  function handleHistorySelect(cursor) {
    setHistoryCursor(cursor >= game.history.length ? null : Math.max(0, cursor));
  }

  function handleHintRequest() {
    if (!canRequestHint) return;
    setZenMode(false);
    setHistoryCursor(null);
    setHintState((current) => current?.fen === game.fen
      ? { fen: game.fen, stage: Math.min(4, current.stage + 1) }
      : { fen: game.fen, stage: 1 });
  }

  function handleHintReveal() {
    setHintState((current) => current?.fen === game.fen
      ? { ...current, stage: Math.min(4, current.stage + 1) }
      : { fen: game.fen, stage: 1 });
  }

  function handleShare() {
    if (game.outcome) setOutcomeDismissed(true);
    setActivePanel("share");
  }

  function requestRestart() {
    if (game.history.length === 0) handleRestart();
    else setPendingAction("restart");
  }

  function requestNewGame() {
    if (game.history.length === 0) onNewGame();
    else setPendingAction("new-game");
  }

  function requestResign() {
    setPendingAction("resign");
  }

  function handleConfirmAction() {
    const action = pendingAction;
    setPendingAction(null);
    if (action === "restart") handleRestart();
    else if (action === "new-game") onNewGame();
    else if (action === "resign") game.resign();
  }

  const commandActions = [
    { id: "undo", label: "Undo Move", detail: "Rewind the last turn", keywords: "back rewind", icon: Undo2, shortcut: "U", disabled: game.history.length === 0, onSelect: handleUndo },
    { id: "flip", label: "Flip Board", detail: "View from the other side", keywords: "rotate orientation", icon: ArrowDownUp, shortcut: "F", onSelect: game.flip },
    { id: "hint", label: hintStage > 0 ? "Reveal Next Hint" : "Request a Hint", detail: "Uncover the idea one step at a time", keywords: "help coach best move explain", icon: Lightbulb, shortcut: "H", disabled: !canRequestHint, onSelect: handleHintRequest },
    ...(!isLivePosition ? [{ id: "live", label: "Return to Live Position", detail: "Jump back to the current board", keywords: "history end", icon: Radio, shortcut: "End", onSelect: () => setHistoryCursor(null) }] : []),
    { id: "share", label: "Share Game", detail: "Copy or download the PGN", keywords: "export clipboard fen pgn", icon: Share2, onSelect: handleShare },
    { id: "zen", label: zenMode ? "Exit Zen Mode" : "Enter Zen Mode", detail: "Give the board the whole room", keywords: "focus fullscreen", icon: zenMode ? Minimize2 : Maximize2, shortcut: "Z", onSelect: () => setZenMode((current) => !current) },
    { id: "appearance", label: "Board Appearance", detail: "Change pieces, palette, and coordinates", keywords: "theme style pieces", icon: Palette, onSelect: () => setActivePanel("appearance") },
    { id: "engine", label: "Engine Settings", detail: "Adjust Stockfish strength", keywords: "computer ai level", icon: Bot, onSelect: () => setActivePanel("engine") },
    { id: "restart", label: "Restart Game", detail: "Return to the initial position", keywords: "reset again", icon: RotateCcw, danger: game.history.length > 0, onSelect: requestRestart },
    game.outcome
      ? { id: "review", label: "Review Game", detail: "Analyse every move with Stockfish", keywords: "analysis accuracy", icon: ScanSearch, onSelect: handleReview }
      : { id: "resign", label: "Resign Game", detail: "Concede the current game", keywords: "forfeit end", icon: Flag, danger: true, onSelect: requestResign },
    { id: "new-game", label: "New Game", detail: "Choose new players and a position", keywords: "setup start", icon: Plus, danger: game.history.length > 0, onSelect: requestNewGame },
  ];

  if (reviewMode) {
    return (
      <GameReview
        session={session}
        history={game.history}
        appearance={appearance}
        orientation={game.orientation}
        analyzePosition={game.analyzePosition}
        cancelAnalysis={game.cancelAnalysis}
        onFinish={handleFinishReview}
        onRestart={handleRestart}
        onNewGame={onNewGame}
      />
    );
  }

  return (
    <main className={pageClassName}>
      <div className="ambient ambient-game" />
      <header className="game-header">
        <div className="brand"><span className="brand-mark">♞</span><span>Chess</span></div>
        <div className="game-header-meta"><span>Local match</span><i /> <span>{getEngineLevel(game.engineSkill).name} · L{game.engineSkill}</span></div>
        <div className="game-header-actions">
          <button className="header-command" type="button" aria-keyshortcuts="Control+K Meta+K" onClick={() => setActivePanel("commands")}><Command size={13} aria-hidden="true" /> Commands <kbd>⌘K</kbd></button>
          <button className="header-new-game" onClick={requestNewGame}>New game <span>↗</span></button>
        </div>
      </header>

      <section className="game-workspace">
        <animated.div className="board-column" style={entrance}>
          <PlayerStrip color={topColor} type={session.players[topColor]} skill={game.engineSkill} active={isLivePosition && game.turn === topColor && !game.outcome} thinking={game.turn === topColor && game.engineStatus.phase === "thinking" && session.players[topColor] === PLAYER.COMPUTER} />
          <div className="board-and-eval">
            <EvaluationBar evaluation={isLivePosition ? game.evaluation : null} orientation={game.orientation} />
            <ChessBoard chess={displayChess} fen={displayFen} turn={displayTurn} orientation={game.orientation} appearance={appearance} canMove={isLivePosition && game.canMove} onMove={game.requestMove} lastMove={isLivePosition ? null : displayMove} hintSquare={visibleHintStage >= 2 ? hint?.from : null} suggestedMove={visibleHintStage >= 3 ? hint?.bestMove : null} />
          </div>
          <PlayerStrip color={bottomColor} type={session.players[bottomColor]} skill={game.engineSkill} active={isLivePosition && game.turn === bottomColor && !game.outcome} thinking={game.turn === bottomColor && game.engineStatus.phase === "thinking" && session.players[bottomColor] === PLAYER.COMPUTER} />
        </animated.div>

        <aside className="match-rail">
          <header className="rail-heading">
            <div><p className="eyebrow">{isLivePosition ? "Current game" : "Exploring history"}</p><h1>{isLivePosition ? (game.outcome ? "Game complete" : inCheck ? "King in check" : `${COLOR_NAME[game.turn]} to move`) : (displayCursor === 0 ? "Starting position" : `${Math.ceil(displayCursor / 2)}${displayCursor % 2 === 0 ? "…" : "."} ${displayMove.san}`)}</h1>{opening ? <p className="opening-name"><span>{opening.eco}</span>{opening.name}</p> : null}</div>
            <div className="rail-heading-signals"><EngineIndicator status={game.engineStatus} skill={game.engineSkill} onOpen={() => setActivePanel("engine")} /><span className={inCheck ? "turn-orb danger" : "turn-orb"} /></div>
          </header>
          <section className={visibleHintStage > 0 ? "notation hint-active" : isLivePosition ? "notation" : "notation history-active"}>
            <header><h2>{visibleHintStage > 0 ? "Position Hint" : "Notation"}</h2><span>{visibleHintStage > 0 ? `${visibleHintStage} / 4 revealed` : isLivePosition ? `${game.history.length} ply` : `${displayCursor} / ${game.history.length}`}</span></header>
            {visibleHintStage > 0
              ? <HintPanel stage={visibleHintStage} hint={hint} engineStatus={game.engineStatus} onReveal={handleHintReveal} onRetry={game.retryEngine} onClose={() => setHintState(null)} />
              : <MoveHistory history={game.history} cursor={displayCursor} onSelect={handleHistorySelect} />}
          </section>
          <div className="game-controls">
            <button aria-keyshortcuts="u" onClick={handleUndo} disabled={game.history.length === 0}><Undo2 size={18} aria-hidden="true" /><span>Undo</span><kbd>U</kbd></button>
            <button aria-keyshortcuts="f" onClick={game.flip}><ArrowDownUp size={18} aria-hidden="true" /><span>Flip</span><kbd>F</kbd></button>
            {game.outcome
              ? <button onClick={handleShare}><Share2 size={18} aria-hidden="true" /><span>Share</span></button>
              : <button className={visibleHintStage > 0 ? "hint-control active" : "hint-control"} aria-keyshortcuts="h" onClick={handleHintRequest} disabled={!canRequestHint}><Lightbulb size={18} aria-hidden="true" /><span>Hint</span><kbd>H</kbd></button>}
            <button onClick={() => setActivePanel("commands")}><MoreHorizontal size={18} aria-hidden="true" /><span>More</span></button>
          </div>
          {game.outcome
            ? <button className="rail-game-action review" onClick={handleReview}><ScanSearch size={16} aria-hidden="true" /><span>Review Game</span><small>See accuracy & key moments</small></button>
            : <button className="rail-game-action resign" onClick={requestResign}><Flag size={15} aria-hidden="true" /><span>Resign Game</span></button>}
          <footer className="rail-footer"><Settings2 size={14} aria-hidden="true" /><span><kbd>⌘K</kbd> commands · right-click to draw arrows</span></footer>
        </aside>
      </section>

      {zenMode ? (
        <div className="zen-controls">
          <button className="zen-restart" type="button" onClick={requestRestart}><RotateCcw size={14} /> Restart</button>
          <button className="zen-exit" type="button" aria-keyshortcuts="z Escape" onClick={() => setZenMode(false)}><Minimize2 size={14} /> Exit zen <kbd>Z</kbd></button>
        </div>
      ) : null}

      {activePanel === "appearance" ? <AppearancePanel appearance={appearance} onChange={onAppearanceChange} onClose={() => setActivePanel(null)} /> : null}
      {activePanel === "engine" ? <EnginePanel skill={game.engineSkill} status={game.engineStatus} onChange={game.changeEngineSkill} onRetry={game.retryEngine} onClose={() => setActivePanel(null)} /> : null}
      {activePanel === "share" ? <ShareGameDialog session={session} pgn={game.pgn} fen={game.fen} outcome={game.outcome} moveCount={game.history.length} onClose={() => setActivePanel(null)} /> : null}
      {activePanel === "commands" ? <GameCommandMenu actions={commandActions} onClose={() => setActivePanel(null)} /> : null}
      {game.pendingPromotion ? <PromotionDialog color={game.pendingPromotion.color} onChoose={game.choosePromotion} onClose={game.cancelPromotion} /> : null}
      {showGameOver ? (
        <GameOverOverlay
          outcome={game.outcome}
          moveCount={game.history.length}
          canUndo={game.history.length > 0}
          onUndo={handleUndo}
          onClose={() => setOutcomeDismissed(true)}
          onReview={handleReview}
          onRestart={requestRestart}
          onNewGame={requestNewGame}
          onShare={handleShare}
        />
      ) : null}
      {confirmation ? <ConfirmActionDialog {...confirmation} onConfirm={handleConfirmAction} onClose={() => setPendingAction(null)} /> : null}
      {game.toast ? <div className="toast" role="status">{game.toast}</div> : null}
    </main>
  );
}

function isEditableTarget(target) {
  return target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
}

function PlayerStrip({ color, type, skill, active, thinking }) {
  const Icon = type === PLAYER.COMPUTER ? Bot : UserRound;
  const level = getEngineLevel(skill);
  return <div className={active ? "player-strip active" : "player-strip"}><div className={`player-avatar avatar-${color}`}><Icon size={18} /></div><div><strong>{type === PLAYER.COMPUTER ? "Stockfish" : `${COLOR_NAME[color]} player`}</strong><span>{type === PLAYER.COMPUTER ? `Level ${level.value} · ${level.name}` : "At the board"}</span></div><div className="player-state">{thinking ? <><i className="thinking-dot" />Thinking</> : active ? "To move" : "Waiting"}</div></div>;
}

function EngineIndicator({ status, skill, onOpen }) {
  const copy = getEngineStatusCopy(status);
  const level = getEngineLevel(skill);
  const triggerClass = `engine-indicator-trigger engine-${status.phase}`;
  return (
    <div className="engine-indicator">
      <button className={triggerClass} type="button" aria-describedby="engine-status-tooltip" aria-label={`${copy.title}. Level ${level.value}, ${level.name}. Open engine settings.`} onClick={onOpen}><span /></button>
      <span className="engine-indicator-tooltip" id="engine-status-tooltip" role="tooltip"><strong>{copy.title}</strong><span>{copy.detail}</span><small>Level {level.value} · {level.name} — select to adjust</small></span>
    </div>
  );
}

function getEngineStatusCopy(status) {
  if (status.phase === "loading") {
    const percent = Math.round((status.progress ?? 0) * 100);
    return { title: "Loading Stockfish", detail: percent > 0 ? `${percent}% downloaded` : "Preparing the local engine…" };
  }
  if (status.phase === "thinking") return { title: "Stockfish is thinking", detail: "Analysing this position locally" };
  if (status.phase === "error") return { title: "Stockfish unavailable", detail: `${status.message || "The engine stopped."} Select to retry.` };
  if (status.phase === "idle") return { title: "Stockfish waiting", detail: "Starts when analysis is needed" };
  return { title: "Stockfish ready", detail: "Running locally in your browser" };
}

function getConfirmation(action) {
  if (action === "restart") {
    return {
      title: "Restart this game?",
      description: "The board returns to its initial position and the current move history is cleared.",
      confirmLabel: "Restart Game",
      danger: true,
    };
  }
  if (action === "new-game") {
    return {
      title: "Leave this game?",
      description: "The current game is removed from this device before you choose new players.",
      confirmLabel: "Start New Game",
      danger: true,
    };
  }
  if (action === "resign") {
    return {
      title: "Resign this game?",
      description: "The opponent is awarded the result. You can still review the game afterward.",
      confirmLabel: "Resign Game",
      danger: true,
    };
  }
  return null;
}
