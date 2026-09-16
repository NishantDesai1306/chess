import { useEffect, useRef } from "react";

export function ReviewMoveList({ moves, classifications, cursor, onSelect }) {
  const activeRef = useRef(null);
  const rows = [];
  for (let index = 0; index < moves.length; index += 2) {
    rows.push({ number: index / 2 + 1, white: moves[index], black: moves[index + 1] });
  }

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [cursor]);

  return (
    <ol className="review-move-list">
      {rows.map((row) => (
        <li key={row.number}>
          <span>{row.number}.</span>
          <ReviewMove move={row.white} quality={classifications[row.white.index - 1]} cursor={cursor} activeRef={activeRef} onSelect={onSelect} />
          {row.black ? <ReviewMove move={row.black} quality={classifications[row.black.index - 1]} cursor={cursor} activeRef={activeRef} onSelect={onSelect} /> : <i />}
        </li>
      ))}
    </ol>
  );
}

function ReviewMove({ move, quality, cursor, activeRef, onSelect }) {
  const active = cursor === move.index;
  const className = `review-move${cursor === move.index ? " active" : ""}${quality ? ` quality-${quality.id}` : ""}`;
  return (
    <button ref={active ? activeRef : null} className={className} type="button" aria-current={active ? "step" : undefined} onClick={() => onSelect(move.index)}>
      <span>{move.san}</span>
      {quality ? <small title={quality.label} aria-label={quality.label}>{quality.symbol}</small> : <small className="quality-pending">·</small>}
    </button>
  );
}
