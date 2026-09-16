import { useEffect, useState } from "react";
import { REVIEW_DEPTH, getTerminalAnalysis } from "../game/review.js";

export function useGameReview({ positions, analyzePosition, cancelAnalysis }) {
  const [analyses, setAnalyses] = useState(() => Array(positions.length).fill(null));
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [run, setRun] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function analyzeGame() {
      setError("");
      setProgress(0);
      setAnalyses(Array(positions.length).fill(null));
      try {
        for (let index = 0; index < positions.length; index += 1) {
          if (ignore) return;
          const terminal = getTerminalAnalysis(positions[index]);
          const result = terminal ?? await analyzePosition(positions[index], REVIEW_DEPTH);
          if (ignore) return;
          setAnalyses((current) => {
            const next = [...current];
            next[index] = result;
            return next;
          });
          setProgress(index + 1);
        }
      } catch (analysisError) {
        if (!ignore && analysisError.name !== "AbortError") setError(analysisError.message || "Game review stopped unexpectedly.");
      }
    }

    analyzeGame();
    return () => {
      ignore = true;
      cancelAnalysis();
    };
  }, [analyzePosition, cancelAnalysis, positions, run]);

  return {
    analyses,
    progress,
    error,
    retry: () => setRun((value) => value + 1),
  };
}
