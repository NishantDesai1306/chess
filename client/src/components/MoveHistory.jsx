import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Radio } from "lucide-react";

export function MoveHistory({ history, cursor = history.length, onSelect }) {
  const endRef = useRef(null);
  const activeRef = useRef(null);
  useEffect(() => {
    const target = cursor === history.length ? endRef.current : activeRef.current;
    target?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [cursor, history.length]);

  const rows = [];
  for (let index = 0; index < history.length; index += 2) {
    rows.push({
      number: index / 2 + 1,
      white: history[index] ? { ...history[index], cursor: index + 1 } : null,
      black: history[index + 1] ? { ...history[index + 1], cursor: index + 2 } : null,
    });
  }

  if (rows.length === 0) {
    return <div className="moves-empty"><span>♙</span><p>Your moves will gather here.</p></div>;
  }
  return (
    <>
      <ol className="move-list">
        {rows.map((row) => <li key={row.number}><span>{row.number}.</span><HistoryMove move={row.white} cursor={cursor} activeRef={activeRef} onSelect={onSelect} />{row.black ? <HistoryMove move={row.black} cursor={cursor} activeRef={activeRef} onSelect={onSelect} /> : <i />}</li>)}
        <li ref={endRef} className="move-list-end" aria-hidden="true" />
      </ol>
      <div className="history-navigation">
        <button type="button" aria-label="Previous position" onClick={() => onSelect?.(Math.max(0, cursor - 1))} disabled={cursor === 0}><ChevronLeft size={16} /></button>
        <button className={cursor === history.length ? "live-position active" : "live-position"} type="button" onClick={() => onSelect?.(history.length)}><Radio size={13} />{cursor === history.length ? "Live" : "Return live"}</button>
        <button type="button" aria-label="Next position" onClick={() => onSelect?.(Math.min(history.length, cursor + 1))} disabled={cursor === history.length}><ChevronRight size={16} /></button>
      </div>
    </>
  );
}

function HistoryMove({ move, cursor, activeRef, onSelect }) {
  const active = cursor === move.cursor;
  return <button ref={active ? activeRef : null} className={active ? "history-move active" : "history-move"} type="button" aria-current={active ? "step" : undefined} onClick={() => onSelect?.(move.cursor)}>{move.san}</button>;
}
