import { useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";

export function ConfirmActionDialog({ title, description, confirmLabel, danger = false, onConfirm, onClose }) {
  const cancelRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia("(pointer: fine)").matches) cancelRef.current?.focus();
  }, []);

  return (
    <div className="modal-backdrop confirm-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-description">
        <button className="icon-button confirm-close" type="button" aria-label="Cancel and close" onClick={onClose}><X size={17} aria-hidden="true" /></button>
        <div className={danger ? "confirm-seal danger" : "confirm-seal"}><AlertTriangle size={22} aria-hidden="true" /></div>
        <p className="eyebrow">Please confirm</p>
        <h2 id="confirm-title">{title}</h2>
        <p id="confirm-description">{description}</p>
        <div className="confirm-actions">
          <button ref={cancelRef} className="secondary-button" type="button" onClick={onClose}>Keep Playing</button>
          <button className={danger ? "primary-button danger-button" : "primary-button"} type="button" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </section>
    </div>
  );
}
