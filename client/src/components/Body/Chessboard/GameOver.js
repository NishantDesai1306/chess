import { COLOR, PIECE } from "cm-chessboard/src/cm-chessboard/Chessboard";
import React, { useCallback, useEffect, useMemo } from "react";
import { Modal } from "react-bootstrap";

export default function GameOver({ onSubmit, winner, drawReason }) {
  const show = useMemo(() => !!winner || !!drawReason, [drawReason, winner]);
  const loadChessPieceSvg = useCallback((pieceId, destContainerId, classesToAddToDest = []) => {
    try {
      const svgScale = 175;
      const pieceSprite = document.querySelector(`#chessboardSpriteCache svg #${pieceId}`).outerHTML;
      const pieceSvgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgScale}" height="${svgScale}" viewBox="0 0 40 40">${pieceSprite}</svg>`;
      const pieceSvg = new DOMParser().parseFromString(pieceSvgStr, 'text/xml');
      
      const dest = document.getElementById(destContainerId);

      if (!dest) {
        throw new Error(`destination note ${destContainerId} not found`);
      }
      
      dest.append(pieceSvg.childNodes[0]);

      if (classesToAddToDest.length > 0) {
        const validClasses = classesToAddToDest.filter((c) => !!c);
        dest.classList.add(...validClasses);
      }
    }
    catch (e) {
      return false;
    }

    return true;
  }, []);
  
  useEffect(() => {
    const handle = setInterval(() => {
      const existingSprite = document.querySelector('#chessboardSpriteCache svg #wk');

      if (existingSprite) {
        const commonClassesToAdd = ['border', 'border-5', 'rounded'];
        const winnerClasses = ['bg-primary', 'border-primary'];

        loadChessPieceSvg(PIECE.bk, "black-king", [ ...commonClassesToAdd, ...(winner === COLOR.black ? winnerClasses : [])]);
        loadChessPieceSvg(PIECE.wk, "white-king", [ ...commonClassesToAdd, ...(winner === COLOR.white ? winnerClasses : [])]);
        clearInterval(handle);
      }
    }, 500);

    return () => clearInterval(handle);
  }, [loadChessPieceSvg, winner, show]);

  return (
    <Modal show={show} onHide={onSubmit}>
      <Modal.Header closeButton>
        <Modal.Title>Game Over</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <div className="d-flex justify-content-between align-items-center">
          <div id="white-king" />
          <div id="black-king" />
        </div>

        <div className="mt-2 text-center">
          {
            winner && (
              <h1>
                {winner === COLOR.white ? "White" : "Black"} won the game
              </h1>
            )
          }

          {
            drawReason && (
              <h1>
                Game ended in a draw ({drawReason})
              </h1>
            )
          }
        </div>
      </Modal.Body>
    </Modal>
  );
}
