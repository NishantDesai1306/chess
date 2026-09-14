import { useEffect, useRef } from "react";

export function MoveHistory({ history }) {
  const endRef = useRef(null);
  useEffect(() => endRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }), [history.length]);

  const rows = [];
  for (let index = 0; index < history.length; index += 2) {
    rows.push({ number: index / 2 + 1, white: history[index]?.san, black: history[index + 1]?.san });
  }

  if (rows.length === 0) {
    return <div className="moves-empty"><span>♙</span><p>Your moves will gather here.</p></div>;
  }
  return (
    <ol className="move-list">
      {rows.map((row) => <li key={row.number}><span>{row.number}.</span><strong>{row.white}</strong><strong>{row.black ?? ""}</strong></li>)}
      <li ref={endRef} className="move-list-end" aria-hidden="true" />
    </ol>
  );
}
