import Accordion from "react-bootstrap/Accordion";
import { useAccordionButton } from "react-bootstrap/AccordionButton";

import { ReactComponent as FlipIcon } from "bootstrap-icons/icons/arrow-down-up.svg";
import { ReactComponent as SettingsIcon } from "bootstrap-icons/icons/gear-fill.svg";
import { ReactComponent as PaletteIcon } from "bootstrap-icons/icons/palette-fill.svg";
import { useState } from "react";
import ThemeModal from "./ThemeModal";

function ContextAwareToggle({ eventKey, callback }) {
  const decoratedOnClick = useAccordionButton(
    eventKey,
    () => callback && callback(eventKey)
  );

  return (
    <div className="cursor-pointer" onClick={decoratedOnClick} title="Settings">
      <SettingsIcon fill="lightgray" />
    </div>
  );
}

function SettingsMenu({ toggelOrientation }) {
  const [showThemeModal, setShowThemeModal] = useState(false);

  return (
    <div>
      <Accordion>
        <ContextAwareToggle eventKey="0" />

        <Accordion.Collapse eventKey="0">
          <div className="d-flex flex-column cursor-pointer">
            <div onClick={toggelOrientation} title="Flip Board">
              <FlipIcon fill="lightgray" />
            </div>
          </div>
        </Accordion.Collapse>
        <Accordion.Collapse eventKey="0">
          <div className="d-flex flex-column cursor-pointer">
            <div onClick={() => setShowThemeModal(true)} title="Theme">
              <PaletteIcon fill="lightgray" />
            </div>
          </div>
        </Accordion.Collapse>
      </Accordion>

      <ThemeModal
        show={showThemeModal}
        onHide={() => setShowThemeModal(false)}
      />
    </div>
  );
}

export default SettingsMenu;
