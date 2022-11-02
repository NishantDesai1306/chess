import ChessBoardComponent, { PlayerType } from "./Chessboard";

import "./index.css";

const Body = () => {
  return (
    <div className="h-100">
      <ChessBoardComponent
        // fen="6q1/8/5k1K/8/8/8/8/8 b - - 0 1"
        whitePlayerType={PlayerType.HUMAN}
        blackPlayerType={PlayerType.AI}
      />
    </div>
  );
};

export default Body;
