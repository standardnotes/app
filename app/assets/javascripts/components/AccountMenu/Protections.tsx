import { WebApplication } from '@/ui_models/application';
import { FunctionalComponent } from 'preact';
import { useCallback, useState } from '@node_modules/preact/hooks';
import { useEffect } from 'preact/hooks';
import { ApplicationEvent } from '@node_modules/@standardnotes/snjs';
import { isSameDay } from '@/utils';

type Props = {
  application: WebApplication;
};

const Protections: FunctionalComponent<Props> = ({ application }) => {
  const enableProtections = () => {
    application.clearProtectionSession();
  };

  const hasProtections = application.hasProtectionSources();

  const getProtectionsDisabledUntil = useCallback((): string | null => {
    const protectionExpiry = application.getProtectionSessionExpiryDate();
    const now = new Date();
    if (protectionExpiry > now) {
      let f: Intl.DateTimeFormat;
      if (isSameDay(protectionExpiry, now)) {
        f = new Intl.DateTimeFormat(undefined, {
          hour: 'numeric',
          minute: 'numeric'
        });
      } else {
        f = new Intl.DateTimeFormat(undefined, {
          weekday: 'long',
          day: 'numeric',
          month: 'short',
          hour: 'numeric',
          minute: 'numeric'
        });
      }

      return f.format(protectionExpiry);
    }
    return null;
  }, [application]);

  const [protectionsDisabledUntil, setProtectionsDisabledUntil] = useState(getProtectionsDisabledUntil());

  useEffect(() => {
    const removeProtectionSessionExpiryDateChangedObserver = application.addEventObserver(
      async () => {
        setProtectionsDisabledUntil(getProtectionsDisabledUntil());
      },
      ApplicationEvent.ProtectionSessionExpiryDateChanged
    );

    return () => {
      removeProtectionSessionExpiryDateChangedObserver();
    };
  }, [application, getProtectionsDisabledUntil]);

  if (!hasProtections) {
    return null;
  }

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
};

export default Protections;
