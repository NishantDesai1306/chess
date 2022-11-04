import { useEffect, useState } from "react";
import { COLOR } from "cm-chessboard/src/cm-chessboard/Chessboard";
import { Chess } from "chess.js";

import ChessBoardComponent from "./Chessboard";
import NewGameView from "./NewGameModal";

import "./index.css";

const Body = () => {
  const [gameConfig, setGameConfig] = useState(null);
  const [chess, setChess] = useState(null);

  useEffect(() => {
    if (gameConfig) {
      setChess(new Chess(gameConfig.fen));
    }
  }, [gameConfig]);

  if (!chess) {
    return (
      <div className="d-flex align-items-center justify-content-center">
        <NewGameView
          onSubmit={(config) => setGameConfig(config)}
        />
      </div>
    )
  }

  return (
    <div className="h-100">
      <ChessBoardComponent
        chess={chess}
        whitePlayerType={gameConfig[COLOR.white]}
        blackPlayerType={gameConfig[COLOR.black]}
      />
    </div>
  );
};

export default Body;
