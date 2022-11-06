import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Dropdown, Form, Modal, Nav } from "react-bootstrap";
import { ReactComponent as CheckCircleFillIcon } from "bootstrap-icons/icons/check-circle-fill.svg";
import {
  DEFAULT_BOARD_STYLE,
  DEFAULT_PIECE_SET,
  getBoardStyle,
  getCoordinateStatus,
  getFrameStyle,
  getPieceStyle,
  setBoardStyle,
  setCoordinateStatus,
  setFrameStyle,
  setPieceStyle,
} from "../../../../utils/storage";
import {
  BORDER_TYPE,
  Chessboard,
} from "cm-chessboard/src/cm-chessboard/Chessboard";
import { FEN } from "cm-chessboard/src/cm-chessboard/model/Position";

const TABS = {
  BOARD: "BOARD",
  PIECE: "PIECE",
  PREVIEW: "PREVIEW",
};

function ColorBox({ color, dimension = 50, className = "" }) {
  return (
    <div
      style={{ height: dimension, width: dimension, background: color }}
      className={`rounded border ${className}`}
    />
  );
}
function BoardSelection() {
  const [coordinateStatus, setShowCoordinateStatus] = useState(
    getCoordinateStatus()
  );
  const [frameValue, setFrameValue] = useState(getFrameStyle());
  const [selectedTheme, setSelectedTheme] = useState(getBoardStyle());
  const themes = useMemo(() => {
    return {
      [DEFAULT_BOARD_STYLE]: {
        black: "#c5a076",
        white: "#ecdab9",
      },
      black: {
        black: "#000000",
        white: "#ffffff",
      },
      green: {
        black: "#4c946a",
        white: "#e0ddcc",
      },
      blue: {
        black: "#86afcf",
        white: "#e0ddcc",
      },
      gray: {
        black: "#9c9c9c",
        white: "#ffffff",
      },
    };
  }, []);

  const selectBoardTheme = useCallback((boardStyle) => {
    setSelectedTheme(boardStyle);
    setBoardStyle(boardStyle);
  }, []);
  const onCoordinatesChange = useCallback((bool) => {
    setShowCoordinateStatus(bool);
    setCoordinateStatus(bool);
  }, []);
  const onFrameValueChange = useCallback((frameValue) => {
    setFrameValue(frameValue);
    setFrameStyle(frameValue);
  }, []);

  return (
    <div>
      <div className="row">
        {Object.entries(themes).map(([colorName, { black, white }]) => {
          return (
            <div
              key={colorName}
              className="col-6 cursor-pointer position-relative"
              onClick={() => selectBoardTheme(colorName)}
            >
              <div className="mb-3 py-2 border border-2 rounded d-flex flex-column align-items-center">
                <div className="mb-2 d-flex">
                  <ColorBox color={black} className="mx-2" />
                  <ColorBox color={white} className="mx-2" />
                </div>
                <div className="text-capitalize">{colorName}</div>
              </div>

              {colorName === selectedTheme && (
                <div style={{ position: "absolute", bottom: 20, right: 20 }}>
                  <CheckCircleFillIcon />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <hr />

      <div className="mb-2">
        <Form.Check
          type="checkbox"
          label="Show range and files"
          checked={coordinateStatus}
          onChange={(e) => onCoordinatesChange(!coordinateStatus)}
        />
      </div>

      <div className="d-flex align-items-center">
        <div className="mx-2">Frame Style</div>

        <div>
          <Dropdown>
            <Dropdown.Toggle variant="primary">{frameValue}</Dropdown.Toggle>

            <Dropdown.Menu>
              <Dropdown.Item
                onClick={(e) => onFrameValueChange(BORDER_TYPE.none)}
              >
                {BORDER_TYPE.none}
              </Dropdown.Item>
              <Dropdown.Item
                onClick={(e) => onFrameValueChange(BORDER_TYPE.thin)}
              >
                {BORDER_TYPE.thin}
              </Dropdown.Item>
              <Dropdown.Item
                onClick={(e) => onFrameValueChange(BORDER_TYPE.frame)}
              >
                {BORDER_TYPE.frame}
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>
    </div>
  );
}

const PieceSvg = ({ id, url, pieceId = "bk" }) => {
  const destContainerId = useMemo(() => `${id}-piece-container`, [id]);
  const [svg, setSvg] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isErrored, setIsErrored] = useState(false);

  useEffect(() => {
    fetch(url)
      .then((res) => res.text())
      .then(setSvg)
      .catch(setIsErrored)
      .then(() => setIsLoaded(true));
  }, [url]);

  const loadChessPieceSvg = useCallback(() => {
    try {
      const svgScale = 125;
      const pieceSprite = document.querySelector(
        `#${id} svg #${pieceId}`
      ).outerHTML;
      const pieceSvgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgScale}" height="${svgScale}" viewBox="0 0 40 40">${pieceSprite}</svg>`;
      const pieceSvg = new DOMParser().parseFromString(pieceSvgStr, "text/xml");

      const dest = document.getElementById(destContainerId);

      if (!dest) {
        throw new Error(`destination note ${destContainerId} not found`);
      }

      dest.append(pieceSvg.childNodes[0]);
    } catch (e) {
      return false;
    }

    return true;
  }, [destContainerId, id, pieceId]);

  useEffect(() => {
    if (!isLoaded) return;

    loadChessPieceSvg();
  }, [isLoaded, loadChessPieceSvg]);

  return (
    <div>
      <div
        id={id}
        className={`d-none svgInline svgInline--${
          isLoaded ? "loaded" : "loading"
        } ${isErrored ? "svgInline--errored" : ""}`}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <div id={destContainerId} />
    </div>
  );
};
function PieceSelection() {
  const pieceSprites = useMemo(
    () => [DEFAULT_PIECE_SET, "/assets/images/pieces-staunty.svg"],
    []
  );
  const [selectedSet, setSelectedSet] = useState(getPieceStyle());
  const selectPieceStyle = useCallback((pieceStyle) => {
    setSelectedSet(pieceStyle);
    setPieceStyle(pieceStyle);
  }, []);

  return (
    <div className="row">
      {pieceSprites.map((spriteUrl, index) => {
        return (
          <div
            key={spriteUrl}
            className="cursor-pointer col-6 position-relative"
            onClick={() => selectPieceStyle(spriteUrl)}
          >
            <div className="mb-3 py-2 border border-2 rounded d-flex flex-column align-items-center">
              <PieceSvg id={`piece-${index}`} url={spriteUrl} />
            </div>

            {selectedSet === spriteUrl && (
              <div style={{ position: "absolute", bottom: 20, right: 20 }}>
                <CheckCircleFillIcon />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PreviewView() {
  const PREVIEW_BOARD_ID = useRef("PREVIEW_BOARD");
  const boardRef = useRef();
  const [element, setElement] = useState(null);
  const boardStyle = useMemo(() => getBoardStyle(), []);
  const pieceStyle = useMemo(() => getPieceStyle(), []);
  const coordinateStatus = useMemo(() => getCoordinateStatus(), []);
  const frameStyle = useMemo(() => getFrameStyle(), []);

  useEffect(() => {
    const handle = setInterval(() => {
      const element = document.getElementById(PREVIEW_BOARD_ID.current);

      if (element) {
        setElement(element);
        clearInterval(handle);
      }
    }, 500);

    return () => clearInterval(handle);
  }, []);

  useEffect(() => {
    if (boardRef.current || !element) return;

    boardRef.current = new Chessboard(element, {
      position: FEN.start,
      sprite: {
        url: pieceStyle,
        cache: false,
      },
      style: {
        cssClass: boardStyle,
        borderType: frameStyle,
        showCoordinates: coordinateStatus,
      },
    });
  }, [element, pieceStyle, boardStyle, frameStyle, coordinateStatus]);

  return <div id={PREVIEW_BOARD_ID.current} />;
}

export default function ThemeModal({ show, onHide }) {
  const [bodyView, setBodyView] = useState(TABS.BOARD);

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>
          <div>
            Theme
          </div>
          <div className="fs-6 text-muted">
            Note: changes will take place from next game.
          </div>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <div>
          <Nav fill variant="tabs" defaultActiveKey={TABS.BOARD}>
            <Nav.Item onClick={() => setBodyView(TABS.BOARD)}>
              <Nav.Link eventKey={TABS.BOARD}>Board</Nav.Link>
            </Nav.Item>
            <Nav.Item onClick={() => setBodyView(TABS.PIECE)}>
              <Nav.Link eventKey={TABS.PIECE}>Piece</Nav.Link>
            </Nav.Item>
            <Nav.Item onClick={() => setBodyView(TABS.PREVIEW)}>
              <Nav.Link eventKey={TABS.PREVIEW}>Preview</Nav.Link>
            </Nav.Item>
          </Nav>
        </div>

        <div className="py-4">
          {bodyView === TABS.BOARD && <BoardSelection />}
          {bodyView === TABS.PIECE && <PieceSelection />}
          {bodyView === TABS.PREVIEW && <PreviewView />}
        </div>
      </Modal.Body>
    </Modal>
  );
}
