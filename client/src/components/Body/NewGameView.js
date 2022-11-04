import { COLOR } from "cm-chessboard/src/cm-chessboard/Chessboard";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Button,
  Card,
  Dropdown,
  DropdownButton,
  Form,
  Modal,
} from "react-bootstrap";
import { Chess, validateFen } from "chess.js";
import { PlayerType } from "./Chessboard";

const DEFAULT_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export default function NewGameView({ onSubmit }) {
  const [showFENModal, setShowFENModal] = useState(false);
  const [showPGNModal, setShowPGNModal] = useState(false);
  const [whiteType, setWhiteType] = useState(PlayerType.HUMAN);
  const [blackType, setBlackType] = useState(PlayerType.AI);

  const handleSubmit = useCallback(
    (fen = DEFAULT_FEN) => {
      onSubmit({
        fen,
        [COLOR.white]: whiteType,
        [COLOR.black]: blackType,
      });
    },
    [blackType, onSubmit, whiteType]
  );

  return (
    <Card style={{ minWidth: 300 }}>
      <Card.Header as="h5" className="p-3">
        New Game
      </Card.Header>
      <Card.Body className="px-4">
        <Form className="d-grid gap-2">
          <div>
            <label>White</label>
            <Dropdown>
              <Dropdown.Toggle variant="dark" className="w-100">
                {whiteType}
              </Dropdown.Toggle>

              <Dropdown.Menu>
                <Dropdown.Item onClick={() => setWhiteType(PlayerType.HUMAN)}>
                  {PlayerType.HUMAN}
                </Dropdown.Item>
                <Dropdown.Item onClick={() => setWhiteType(PlayerType.AI)}>
                  {PlayerType.AI}
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>

          <div>
            <label>Black</label>
            <Dropdown>
              <Dropdown.Toggle variant="dark" className="w-100">
                {blackType}
              </Dropdown.Toggle>

              <Dropdown.Menu>
                <Dropdown.Item onClick={() => setBlackType(PlayerType.HUMAN)}>
                  {PlayerType.HUMAN}
                </Dropdown.Item>
                <Dropdown.Item onClick={() => setBlackType(PlayerType.AI)}>
                  {PlayerType.AI}
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>

          <hr className="my-3" />

          <div>
            <Button
              autoFocus
              variant="primary"
              className="w-100"
              size="lg"
              onClick={() => handleSubmit()}
            >
              Start Game
            </Button>
          </div>

          <div className="mt-2">
            <DropdownButton
              title="Load Game"
              variant="light"
              className="w-100 d-flex justify-content-center"
            >
              <Dropdown.Item onClick={() => setShowFENModal(true)}>
                FEN
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setShowPGNModal(true)}>
                PGN
              </Dropdown.Item>
            </DropdownButton>
          </div>
        </Form>
      </Card.Body>

      <FENModal
        show={showFENModal}
        onSubmit={(fen) => handleSubmit(fen)}
        onCancel={() => setShowFENModal(false)}
      />

      <PGNModal
        show={showPGNModal}
        onSubmit={(fen) => handleSubmit(fen)}
        onCancel={() => setShowPGNModal(false)}
      />
    </Card>
  );
}

function FENModal({ show, onSubmit, onCancel }) {
  const [inputRef, setInputRef] = useState();
  const [error, setError] = useState("");
  const [fen, setFen] = useState("");

  const handleSubmit = useCallback(() => {
    const fenStr = fen || DEFAULT_FEN;
    const { valid } = validateFen(fenStr);

    if (!valid) {
      setError("Entered FEN string is invalid");
      inputRef.select();
      return;
    }

    onSubmit(fenStr);
  }, [fen, inputRef, onSubmit]);

  useEffect(() => {
    if (inputRef) {
      inputRef.focus();
    }
  }, [inputRef]);

  return (
    <Modal show={show} onHide={onCancel}>
      <Modal.Header closeButton>
        <Modal.Title>FEN</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();

            handleSubmit();
          }}
        >
          <Form.Group className="mb-3" controlId="formBasicEmail">
            <Form.Label>FEN string</Form.Label>
            <Form.Control
              ref={(ref) => ref && setInputRef(ref)}
              onChange={(e) => setFen(e.target.value)}
              placeholder={DEFAULT_FEN.current}
            />

            {!!error && <div className="text-danger text-center">{error}</div>}
          </Form.Group>
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={() => onCancel()}>
          Close
        </Button>
        <Button variant="primary" onClick={() => onSubmit()}>
          Submit
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

function PGNModal({ show, onSubmit, onCancel }) {
  const [error, setError] = useState("");
  const chess = useMemo(() => new Chess(), []);

  const handleSubmit = useCallback(
    async (e) => {
      alert("uploaded");
      const file = e.target.files[0];
      const pgn = await file.text();
      const isValid = chess.loadPgn(pgn);

      if (!isValid) {
        e.target.value = null;
        setError("PGN file is invalid");
        return;
      }

      const fen = chess.fen();
      onSubmit(fen);
    },
    [chess, onSubmit]
  );

  return (
    <Modal show={show} onHide={onCancel}>
      <Modal.Header closeButton>
        <Modal.Title>PGN</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form.Group controlId="formFile" className="mb-3">
          <Form.Control
            type="file"
            accept=".pgn"
            onChange={(e) => handleSubmit(e)}
          />
        </Form.Group>

        {!!error && <div className="mt-3 text-danger text-center">{error}</div>}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="primary" onClick={() => onCancel()}>
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
