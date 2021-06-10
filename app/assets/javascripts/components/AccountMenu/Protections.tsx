import { WebApplication } from '@/ui_models/application';
import { FC } from 'react';

type Props = {
  application: WebApplication;
  protectionsDisabledUntil: string | null;
};

const Protections: FC<Props> = ({
                       application,
                       protectionsDisabledUntil
                     }) => {
  const enableProtections = () => {
    application.clearProtectionSession();
  };

  return (
    <div className="sk-panel-section">
      <div className="sk-panel-section-title">Protections</div>
      {protectionsDisabledUntil && (
        <div className="sk-panel-section-subtitle info">
          Protections are disabled until {protectionsDisabledUntil}
        </div>
      )}
      {!protectionsDisabledUntil && (
        <div className="sk-panel-section-subtitle info">
          Protections are enabled
        </div>
      )}
      <p className="sk-p">
        Actions like viewing protected notes, exporting decrypted backups,
        or revoking an active session, require additional authentication
        like entering your account password or application passcode.
      </p>
      {protectionsDisabledUntil && (
        <div className="sk-panel-row">
          <button className="sn-button small info" onClick={enableProtections}>
            Enable protections
          </button>
        </div>
      )}
    </div>
  );
}

export default Protections;
