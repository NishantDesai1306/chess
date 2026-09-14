import { animated, useSpring } from "@react-spring/web";

export function EvaluationBar({ evaluation, orientation }) {
  const percentage = getWhitePercentage(evaluation);
  const style = useSpring({ height: `${percentage}%`, config: { tension: 150, friction: 24 } });
  const label = formatEvaluation(evaluation);
  return (
    <div className={`evaluation ${orientation === "b" ? "evaluation-flipped" : ""}`} aria-label={`Position evaluation ${label}`}>
      <div className="evaluation-track"><animated.div className="evaluation-white" style={style} /></div>
      <span className="evaluation-label">{label}</span>
    </div>
  );
}

function getWhitePercentage(evaluation) {
  if (!evaluation) return 50;
  if (evaluation.type === "mate") return evaluation.value > 0 ? 100 : 0;
  return 50 + Math.max(-5, Math.min(5, evaluation.value / 100)) * 8;
}

function formatEvaluation(evaluation) {
  if (!evaluation) return "—";
  if (evaluation.type === "mate") return `M${Math.abs(evaluation.value)}`;
  const pawns = evaluation.value / 100;
  return `${pawns >= 0 ? "+" : ""}${pawns.toFixed(1)}`;
}
