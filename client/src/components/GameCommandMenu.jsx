import { useEffect, useMemo, useRef, useState } from "react";
import { CornerDownLeft, Search, X } from "lucide-react";

export function GameCommandMenu({ actions, onClose }) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const searchRef = useRef(null);
  const filteredActions = useMemo(() => filterActions(actions, query), [actions, query]);
  const activeAction = filteredActions[Math.min(activeIndex, Math.max(0, filteredActions.length - 1))];

  useEffect(() => {
    if (window.matchMedia("(pointer: fine)").matches) searchRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!activeAction) return;
    document.getElementById(`game-command-${activeAction.id}`)?.scrollIntoView({ block: "nearest" });
  }, [activeAction]);

  function handleQueryChange(event) {
    setQuery(event.target.value);
    setActiveIndex(0);
  }

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (filteredActions.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % filteredActions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + filteredActions.length) % filteredActions.length);
    } else if (event.key === "Enter" && activeAction && !activeAction.disabled) {
      event.preventDefault();
      handleSelect(activeAction);
    }
  }

  function handleSelect(action) {
    if (action.disabled) return;
    onClose();
    action.onSelect();
  }

  return (
    <div className="modal-backdrop command-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="command-menu" role="dialog" aria-modal="true" aria-labelledby="command-menu-title" onKeyDown={handleKeyDown}>
        <header>
          <div><p className="eyebrow">Quick actions</p><h2 id="command-menu-title">Command ledger</h2></div>
          <button className="icon-button" type="button" aria-label="Close command menu" onClick={onClose}><X size={18} aria-hidden="true" /></button>
        </header>

        <label className="command-search">
          <Search size={17} aria-hidden="true" />
          <span className="sr-only">Search commands</span>
          <input
            ref={searchRef}
            type="search"
            name="command-search"
            autoComplete="off"
            spellCheck={false}
            placeholder="Search actions…"
            value={query}
            onChange={handleQueryChange}
          />
          <kbd>Esc</kbd>
        </label>

        <div className="command-list" aria-label="Game commands">
          {filteredActions.length > 0 ? filteredActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                className={`${index === activeIndex ? "active " : ""}${action.danger ? "danger" : ""}`.trim()}
                id={`game-command-${action.id}`}
                key={action.id}
                type="button"
                disabled={action.disabled}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => handleSelect(action)}
              >
                <span className="command-icon"><Icon size={17} aria-hidden="true" /></span>
                <span><strong>{action.label}</strong><small>{action.detail}</small></span>
                {action.shortcut ? <kbd>{action.shortcut}</kbd> : null}
              </button>
            );
          }) : (
            <div className="command-empty"><span>♞</span><p>No matching action</p><small>Try “share”, “board”, or “engine”.</small></div>
          )}
        </div>

        <footer><span><b>↑↓</b> Navigate</span><span><CornerDownLeft size={12} aria-hidden="true" /> Run command</span></footer>
      </section>
    </div>
  );
}

function filterActions(actions, query) {
  const needle = query.trim().toLowerCase();
  if (!needle) return actions;
  return actions.filter((action) => `${action.label} ${action.detail} ${action.keywords ?? ""}`.toLowerCase().includes(needle));
}
