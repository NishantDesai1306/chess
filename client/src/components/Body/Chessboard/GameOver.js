import { COLOR, PIECE } from "cm-chessboard/src/cm-chessboard/Chessboard";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { Modal } from "react-bootstrap";

export default function GameOver({ onSubmit, winner, drawReason }) {
  const show = useMemo(() => !!winner || !!drawReason, [drawReason, winner]);
  const areSvgRendered = useRef(false);
  const loadChessPieceSvg = useCallback((pieceId, destContainerId) => {
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
    }
    catch (e) {
      return false;
    }

    return true;
  }, []);
  
  useEffect(() => {
    if (areSvgRendered.current) return;

    const handle = setInterval(() => {
      const existingSprite = document.querySelector('#chessboardSpriteCache svg #wk');

      if (existingSprite) {
        loadChessPieceSvg(PIECE.bk, "black-king");
        loadChessPieceSvg(PIECE.wk, "white-king");

        areSvgRendered.current = true;
        clearInterval(handle);
      }
    }, 500);

    return () => clearInterval(handle);
  }, [loadChessPieceSvg, winner]);

  // keep modal rendered with <Modal />'s show proper set to true otherwise loading king's svg when modal gets rendered will cause flicker at run time
  // so keep modal rendered so that we can put svg in it and hide it until game's over
  return (
    <Modal
      show
      onHide={onSubmit}
      backdrop={show}
      className={show ? "d-block" : "d-none pointer-events-none"}
    >
      <Modal.Header closeButton>
        <Modal.Title>Game Over</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <div className="d-flex justify-content-between align-items-center">
          <div
            id="white-king"
            className={`border border-5 rounded ${winner === COLOR.white ? 'bg-primary border-primary' : ''}`}
          />
          <div
            id="black-king"
            className={`border border-5 rounded ${winner === COLOR.black ? 'bg-primary border-primary' : ''}`}
          />
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
