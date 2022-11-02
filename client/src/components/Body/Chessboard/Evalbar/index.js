import React, { useMemo } from "react";
import useMeasure from "react-use-measure";
import { useSpring, animated } from "@react-spring/web";
import { COLOR } from "cm-chessboard/src/cm-chessboard/Chessboard";

import "./index.css";

const ScoreType = {
  CentiPawn: 'cp',
  MateInMoves: 'mate',
};
const CSSColor = {
  [COLOR.black]: '#272727',
  [COLOR.white]: 'white',
};
const BASE_VALUE = 50;
const EvalBar = ({
  orientation,
  scoreType,
  scoreValue,
}) => {
  const color = useMemo(() => {
    return {
      main: orientation === COLOR.black ? CSSColor[COLOR.white] : CSSColor[COLOR.black],
      bar: orientation === COLOR.black ? CSSColor[COLOR.black] : CSSColor[COLOR.white],
    };
  }, [orientation]);
  const {
    text,
    progress,
  } = useMemo(() => {
    let text = '';
    let progress = null;

    if (scoreType === ScoreType.MateInMoves) {
      if (scoreValue < 0) {
        progress = 0;
      } else {
        progress = 100;
      }
      
      text = `M${Math.abs(scoreValue)}`;
    } else if (scoreType === ScoreType.CentiPawn) {
      const advantage = scoreValue / 100;
      const advantageAbs = Math.abs(advantage);

      // we've divided remaning 40% of bar into 5 segments
      // +1 eval = 50 + 8 = 58%
      // +5 eval = 50 + 40 = 90%
      // over +5 the progress value does not matter as it will become 100% only if there's "mate in x"
      // so limiting the delta calculation to max value of 5
      const progressDelta = Math.min(advantageAbs, 5) * 8;

      // 50% progress value means evaluation is equal i.e. advantage is 0
      progress = BASE_VALUE + (advantage < 0 ? -1 : 1) * progressDelta;
      text = advantageAbs.toString();
    } else {
      progress = BASE_VALUE;
    }

    return {
      text,
      progress,
    }
  }, [scoreType, scoreValue]);

  const [ref, { height }] = useMeasure();
  const props = useSpring({
    height: typeof progress === "number" ? height * (progress / 100) : 0,
  });

  return (
    <div className="eval-bar-container">
      <div
        ref={ref}
        className="eval-bar-main"
        style={{
          border: `2px solid ${color.main}`,
          background: color.main,
        }}
      >
        <animated.div
          className="eval-bar-fill"
          style={{
            ...props,
            background: color.bar,
          }}
        />

        <div
          className={`small fw-bold advantage ${progress < BASE_VALUE ? 'top-advantage' : 'bottom-advantage'}`}
          style={{ color: progress < BASE_VALUE ? color.bar : color.main }}
        >
          {text}
        </div>
      </div>
    </div>
  );
};

export default EvalBar;
