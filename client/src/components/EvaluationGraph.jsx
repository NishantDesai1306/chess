export function EvaluationGraph({ analyses, cursor }) {
  const width = 320;
  const height = 76;
  const points = analyses.map((analysis, index) => analysis ? {
    index,
    x: analyses.length === 1 ? 0 : index / (analyses.length - 1) * width,
    y: scoreToY(analysis.score, height),
  } : null).filter(Boolean);
  const selected = points.find((point) => point.index === cursor);
  const polyline = points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <div className="evaluation-graph" role="img" aria-label="Position evaluation throughout the game">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
        <line className="evaluation-graph-zero" x1="0" x2={width} y1={height / 2} y2={height / 2} />
        {polyline ? <polyline points={polyline} /> : null}
        {selected ? <circle cx={selected.x} cy={selected.y} r="4" /> : null}
      </svg>
    </div>
  );
}

function scoreToY(score, height) {
  const value = score.type === "mate" ? Math.sign(score.value) * 1000 : score.value;
  const normalized = Math.max(-500, Math.min(500, value)) / 500;
  return height / 2 - normalized * (height / 2 - 5);
}
