import Accordion from 'react-bootstrap/Accordion';
import { useAccordionButton } from 'react-bootstrap/AccordionButton';

import { ReactComponent as FlipIcon } from "bootstrap-icons/icons/arrow-down-up.svg"
import { ReactComponent as SettingsIcon } from "bootstrap-icons/icons/gear-fill.svg"

function ContextAwareToggle({ eventKey, callback }) {
  const decoratedOnClick = useAccordionButton(
    eventKey,
    () => callback && callback(eventKey),
  );

  return (
    <div
      className="cursor-pointer"
      onClick={decoratedOnClick}
      title="Settings"
    >
      <SettingsIcon fill="lightgray" />
    </div>
  );
}

function SettingsMenu({ toggelOrientation }) {
  return (
    <Accordion>
      <ContextAwareToggle eventKey="0" />
      <Accordion.Collapse eventKey="0">
        <div className="d-flex flex-column cursor-pointer">
          <div
            onClick={toggelOrientation}
            title="Flip Board"
          >
            <FlipIcon fill="lightgray" />
          </div>
        </div>
      </Accordion.Collapse>
    </Accordion>
  );
}

export default SettingsMenu;