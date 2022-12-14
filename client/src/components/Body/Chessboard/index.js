import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { KING } from "chess.js";
import {
  Chessboard,
  MARKER_TYPE,
  INPUT_EVENT_TYPE,
  COLOR,
  SQUARE_SELECT_TYPE,
} from "cm-chessboard/src/cm-chessboard/Chessboard";
import {
  ARROW_TYPE,
  Arrows,
} from "cm-chessboard/src/cm-chessboard/extensions/arrows/Arrows";
import audio from "../../../utils/audio";

import EvalBar from "./Evalbar";
import { getAnalysis } from "../../../api";

import "cm-chessboard/assets/styles/cm-chessboard.css";
import "cm-chessboard/src/cm-chessboard/extensions/arrows/assets/arrows.css";

import "./index.css";
import SettingsMenu from "./Settings";
import GameOver from "./GameOver";
import {
  getBoardStyle,
  getCoordinateStatus,
  getFrameStyle,
  getPieceStyle,
} from "../../../utils/storage";
const ROOT_ID = "CHESSBOARD-ROOT";

export const PlayerType = {
  HUMAN: "HUMAN",
  AI: "AI",
};
export const Flags = {
  NORMAL: "n",
  CAPTURE: "c",
  BIG_PAWN: "b",
  EP_CAPTURE: "e",
  PROMOTION: "p",
  KSIDE_CASTLE: "k",
  QSIDE_CASTLE: "q",
};

const ChessBoardComponent = ({
  chess,
  blackPlayerType,
  whitePlayerType,
  onGameOver,
}) => {
  const [winner, setWinner] = useState(null);
  const [drawReason, setDrawReason] = useState(null);
  const [cnt, setCnt] = useState(0);

  // stored board config
  const boardStyle = useMemo(() => getBoardStyle(), []);
  const pieceStyle = useMemo(() => getPieceStyle(), []);
  const coordinateStatus = useMemo(() => getCoordinateStatus(), []);
  const frameStyle = useMemo(() => getFrameStyle(), []);

  const [currentTurn, setCurrentTurn] = useState(chess.turn());
  const playerTypeObj = useMemo(() => {
    return {
      [COLOR.black]: blackPlayerType,
      [COLOR.white]: whitePlayerType,
    };
  }, [blackPlayerType, whitePlayerType]);
  const allArrows = useRef([]);
  const lastArrowSquare = useRef(null);
  const analysis = useRef(null);

  const chessboardInstance = useRef();

  const loadAnalysisData = useCallback(
    async (forceReload) => {
      const { bestMove, score } = await getAnalysis(chess.fen());
      const currentOrientation = chessboardInstance.current.getOrientation();
      const isOrientationCorrect =
        chess.get(bestMove.from).color === currentOrientation;

      if (!isOrientationCorrect) {
        score.value *= -1;
      }

      analysis.current = {
        bestMove,
        score,
      };

      if (forceReload) {
        setCnt((cnt) => cnt + 1);
      }

      return {
        bestMove,
        score,
      };
    },
    [chess]
  );

  const onMoveComplete = useCallback(
    async (moveResult) => {
      let audioToPlay = "move";
      const { color, captured } = moveResult;
      const chessboard = chessboardInstance.current;

      if (!chessboard) return;

      if (captured) {
        audioToPlay = "capture";
      }
      if (chess.inCheck()) {
        audioToPlay = "check";
      }
      if (chess.isGameOver()) {
        audioToPlay = "gameOver";

        if (chess.isCheckmate()) {
          setWinner(color);
          console.log(`${color} won the game`);
        } else if (chess.isDraw()) {
          let drawReason = "";

          if (chess.isStalemate()) {
            drawReason = "stalemate";
          } else if (chess.isInsufficientMaterial()) {
            drawReason = "insufficient material";
          } else if (chess.isThreefoldRepetition()) {
            drawReason = "three fold repetition";
          }

          setDrawReason(drawReason);
        }
      }

      if (audio[audioToPlay]) {
        audio[audioToPlay].play();
      }

      chessboard.removeArrows();
      chessboard.disableMoveInput();

      const mover = chess.turn();

      // dont load analysis for computer player as it will do it when running "makeComputerMove()"
      if (playerTypeObj[mover] === PlayerType.HUMAN) {
        // dont put await here as it will force the analysis to load and then enable input for human player
        loadAnalysisData();
      }

      setCurrentTurn(mover);
    },
    [chess, loadAnalysisData, playerTypeObj]
  );

  const handleHumanMove = useCallback(
    async (event) => {
      const { type, chessboard } = event;

      chessboard.removeMarkers(MARKER_TYPE.dot);
      chessboard.removeMarkers(MARKER_TYPE.circle);

      if (type === INPUT_EVENT_TYPE.moveInputStarted) {
        const moves = chess.moves({
          square: event.square,
          verbose: true,
        });

        for (const move of moves) {
          if (
            move.flags.includes(Flags.CAPTURE) ||
            move.flags.includes(Flags.EP_CAPTURE)
          ) {
            chessboard.addMarker(MARKER_TYPE.circle, move.to);
          } else {
            chessboard.addMarker(MARKER_TYPE.dot, move.to);
          }
        }
        return moves.length > 0;
      } else if (type === INPUT_EVENT_TYPE.validateMoveInput) {
        const move = { from: event.squareFrom, to: event.squareTo };
        const result = chess.move(move);

        // result will be null if user tries to make an illegal move
        if (result) {
          chessboard.state.moveInputProcess.then(() => {
            chessboard.setPosition(chess.fen(), true);
            onMoveComplete(result);
          });
        }

        return !!result;
      }
    },
    [chess, onMoveComplete]
  );

  const getSquare = useCallback(
    (type, color) => {
      if (!type || !color) return null;

      const files = ["a", "b", "c", "d", "e", "f", "g", "h"];

      for (const file of files) {
        for (let rank = 1; rank <= 8; rank++) {
          const square = `${file}${rank}`;
          const result = chess.get(square);

          if (result && result.type === type && result.color === color) {
            return square;
          }
        }
      }

      return null;
    },
    [chess]
  );

  const makeComputerMove = useCallback(async () => {
    const chessboard = chessboardInstance.current;

    if (!chessboard) return;

    const {
      bestMove: { from, to },
    } = await loadAnalysisData();

    const moveResult = chess.move({ from, to });
    chessboard.setPosition(chess.fen(), true);

    if (moveResult) {
      onMoveComplete(moveResult);
    }
  }, [chess, loadAnalysisData, onMoveComplete]);

  const toggelOrientation = useCallback(async () => {
    const nextValue =
      chessboardInstance.current.getOrientation() === COLOR.white
        ? COLOR.black
        : COLOR.white;
    chessboardInstance.current.setOrientation(nextValue);
    await loadAnalysisData();
    setCnt((cnt) => cnt + 1);
  }, [loadAnalysisData]);

  const onSquareSelect = useCallback(({ type, square }) => {
    const chessboard = chessboardInstance.current;

    if (type === SQUARE_SELECT_TYPE.primary) {
      lastArrowSquare.current = null;
      return;
    }

    if (!lastArrowSquare.current) {
      lastArrowSquare.current = square;
      return;
    }

    const from = lastArrowSquare.current;
    const to = square;

    if (from !== to) {
      const arrowIndex = allArrows.current.findIndex(
        (arrow) => arrow.from === from && arrow.to === to
      );

      if (arrowIndex > -1) {
        chessboard.removeArrows(ARROW_TYPE.default, from, to);
        allArrows.current.splice(arrowIndex, 1);
      } else {
        chessboard.addArrow(ARROW_TYPE.default, from, to);
        allArrows.current.push({ from, to });
      }

      lastArrowSquare.current = null;
    }
  }, []);

  // init
  useEffect(() => {
    if (!chessboardInstance.current) {
      const element = document.getElementById(ROOT_ID);
      const instance = new Chessboard(element, {
        position: chess.fen(),
        sprite: { url: pieceStyle },
        style: {
          cssClass: boardStyle,
          borderType: frameStyle,
          showCoordinates: coordinateStatus,
        }, // disable standard markers
        orientation: COLOR.white,
        extensions: [
          {
            class: Arrows,
            props: {
              sprite: {
                url: "/assets/images/arrows.svg",
              },
            },
          },
        ],
      });

      instance.enableSquareSelect((event) => {
        onSquareSelect(event);
      });

      chessboardInstance.current = instance;

      loadAnalysisData(true);
    }

    audio.gameStart.play();
  }, [
    boardStyle,
    chess,
    coordinateStatus,
    frameStyle,
    handleHumanMove,
    loadAnalysisData,
    makeComputerMove,
    onSquareSelect,
    pieceStyle,
    playerTypeObj,
  ]);

  useEffect(() => {
    const playerTypeOfMover = playerTypeObj[currentTurn];
    const chessboard = chessboardInstance.current;

    if (!chessboard) return;

    chessboard.removeMarkers(MARKER_TYPE.frame);

    if (chess.inCheck()) {
      const kingSquare = getSquare(KING, currentTurn);

      if (kingSquare) {
        chessboard.addMarker(MARKER_TYPE.frame, kingSquare);
      }
    }

    if (playerTypeOfMover === PlayerType.HUMAN) {
      chessboard.enableMoveInput(handleHumanMove, currentTurn);
    } else {
      makeComputerMove();
    }
  }, [
    chess,
    currentTurn,
    getSquare,
    handleHumanMove,
    makeComputerMove,
    playerTypeObj,
  ]);

  return (
    <div className="h-100 d-flex align-items-center chessboard-container">
      <div className="d-none">{cnt}</div>

      <div className="px-4 py-2 h-100">
        <EvalBar
          orientation={chessboardInstance.current?.getOrientation()}
          scoreType={analysis.current?.score?.type}
          scoreValue={analysis.current?.score?.value}
        />
      </div>

      <div
        onDrag={(e) => console.log(e)}
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => console.log(e)}
        onDragEnd={(e) => console.log(e)}
        id={ROOT_ID}
        className="flex-grow-1"
      />

      <div className="h-100 p-3 d-flex align-items-start">
        <SettingsMenu toggelOrientation={toggelOrientation} />
      </div>

      <GameOver winner={winner} drawReason={drawReason} onSubmit={onGameOver} />
    </div>
  );
};

export default ChessBoardComponent;
