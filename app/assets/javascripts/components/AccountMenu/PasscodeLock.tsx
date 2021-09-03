import {
  STRING_CONFIRM_APP_QUIT_DURING_PASSCODE_CHANGE,
  STRING_CONFIRM_APP_QUIT_DURING_PASSCODE_REMOVAL, STRING_E2E_ENABLED, STRING_ENC_NOT_ENABLED, STRING_LOCAL_ENC_ENABLED,
  STRING_NON_MATCHING_PASSCODES,
  StringUtils,
  Strings
} from '@/strings';
import { WebApplication } from '@/ui_models/application';
import { preventRefreshing } from '@/utils';
import { JSXInternal } from 'preact/src/jsx';
import TargetedEvent = JSXInternal.TargetedEvent;
import { alertDialog } from '@Services/alertService';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { ApplicationEvent } from '@standardnotes/snjs';
import TargetedMouseEvent = JSXInternal.TargetedMouseEvent;
import { observer } from 'mobx-react-lite';
import { AppState } from '@/ui_models/app_state';

type Props = {
  application: WebApplication;
  appState: AppState;
};

const PasscodeLock = observer(({
                                 application,
                                 appState,
                               }: Props) => {
  const keyStorageInfo = StringUtils.keyStorageInfo(application);
  const passcodeAutoLockOptions = application.getAutolockService().getAutoLockIntervalOptions();

  const { setIsEncryptionEnabled, setIsBackupEncrypted, setEncryptionStatusString } = appState.accountMenu;

  const passcodeInputRef = useRef<HTMLInputElement>();

  const [passcode, setPasscode] = useState<string | undefined>(undefined);
  const [passcodeConfirmation, setPasscodeConfirmation] = useState<string | undefined>(undefined);
  const [selectedAutoLockInterval, setSelectedAutoLockInterval] = useState<unknown>(null);
  const [isPasscodeFocused, setIsPasscodeFocused] = useState(false);
  const [showPasscodeForm, setShowPasscodeForm] = useState(false);
  const [canAddPasscode, setCanAddPasscode] = useState(!application.isEphemeralSession());
  const [hasPasscode, setHasPasscode] = useState(application.hasPasscode());

  const handleAddPassCode = () => {
    setShowPasscodeForm(true);
    setIsPasscodeFocused(true);
  };

  const changePasscodePressed = () => {
    handleAddPassCode();
  };

  const reloadAutoLockInterval = useCallback(async () => {
    const interval = await application.getAutolockService().getAutoLockInterval();
    setSelectedAutoLockInterval(interval);
  }, [application]);

  const refreshEncryptionStatus = useCallback(() => {
    const hasUser = application.hasAccount();
    const hasPasscode = application.hasPasscode();

    setHasPasscode(hasPasscode);

    const encryptionEnabled = hasUser || hasPasscode;

    const encryptionStatusString = hasUser
      ? STRING_E2E_ENABLED
      : hasPasscode
        ? STRING_LOCAL_ENC_ENABLED
        : STRING_ENC_NOT_ENABLED;

    setEncryptionStatusString(encryptionStatusString);
    setIsEncryptionEnabled(encryptionEnabled);
    setIsBackupEncrypted(encryptionEnabled);
  }, [application, setEncryptionStatusString, setIsBackupEncrypted, setIsEncryptionEnabled]);

  const selectAutoLockInterval = async (interval: number) => {
    if (!(await application.authorizeAutolockIntervalChange())) {
      return;
    }
    await application.getAutolockService().setAutoLockInterval(interval);
    reloadAutoLockInterval();
  };

  const removePasscodePressed = async () => {
    await preventRefreshing(
      STRING_CONFIRM_APP_QUIT_DURING_PASSCODE_REMOVAL,
      async () => {
        if (await application.removePasscode()) {
          await application
            .getAutolockService()
            .deleteAutolockPreference();
          await reloadAutoLockInterval();
          refreshEncryptionStatus();
        }
      }
    );
  };

  const handlePasscodeChange = (event: TargetedEvent<HTMLInputElement>) => {
    const { value } = event.target as HTMLInputElement;
    setPasscode(value);
  };

  const handleConfirmPasscodeChange = (event: TargetedEvent<HTMLInputElement>) => {
    const { value } = event.target as HTMLInputElement;
    setPasscodeConfirmation(value);
  };

  const submitPasscodeForm = async (event: TargetedEvent<HTMLFormElement> | TargetedMouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    if (!passcode || passcode.length === 0) {
      await alertDialog({
        text: Strings.enterPasscode,
      });
    }

    if (passcode !== passcodeConfirmation) {
      await alertDialog({
        text: STRING_NON_MATCHING_PASSCODES
      });
      setIsPasscodeFocused(true);
      return;
    }

    await preventRefreshing(
      STRING_CONFIRM_APP_QUIT_DURING_PASSCODE_CHANGE,
      async () => {
        const successful = application.hasPasscode()
          ? await application.changePasscode(passcode as string)
          : await application.addPasscode(passcode as string);

        if (!successful) {
          setIsPasscodeFocused(true);
        }
      }
    );

    setPasscode(undefined);
    setPasscodeConfirmation(undefined);
    setShowPasscodeForm(false);

    refreshEncryptionStatus();
  };

  useEffect(() => {
    refreshEncryptionStatus();
  }, [refreshEncryptionStatus]);

  // `reloadAutoLockInterval` gets interval asynchronously, therefore we call `useEffect` to set initial
  // value of `selectedAutoLockInterval`
  useEffect(() => {
    reloadAutoLockInterval();
  }, [reloadAutoLockInterval]);

  useEffect(() => {
    if (isPasscodeFocused) {
      passcodeInputRef.current.focus();
      setIsPasscodeFocused(false);
    }
  }, [isPasscodeFocused]);

  // Add the required event observers
  useEffect(() => {
    const removeKeyStatusChangedObserver = application.addEventObserver(
      async () => {
        setCanAddPasscode(!application.isEphemeralSession());
        setHasPasscode(application.hasPasscode());
        setShowPasscodeForm(false);
      },
      ApplicationEvent.KeyStatusChanged
    );

    return () => {
      removeKeyStatusChangedObserver();
    };
  }, [application]);

  return (
    <div className="sk-panel-section">
      <div className="sk-panel-section-title">Passcode Lock</div>
      {!hasPasscode && (
        <div>
          {canAddPasscode && (
            <>
              {!showPasscodeForm && (
                <div className="sk-panel-row">
                  <button className="sn-button small info" onClick={handleAddPassCode}>
                    Add Passcode
                  </button>
                </div>
              )}
              <p className="sk-p">
                Add a passcode to lock the application and
                encrypt on-device key storage.
              </p>
              {keyStorageInfo && (
                <p>{keyStorageInfo}</p>
              )}
            </>
          )}
          {!canAddPasscode && (
            <p className="sk-p">
              Adding a passcode is not supported in temporary sessions. Please sign
              out, then sign back in with the "Stay signed in" option checked.
            </p>
          )}
        </div>
      )}
      {showPasscodeForm && (
        <form className="sk-panel-form" onSubmit={submitPasscodeForm}>
          <div className="sk-panel-row" />
          <input
            className="sk-input contrast"
            type="password"
            ref={passcodeInputRef}
            value={passcode}
            onChange={handlePasscodeChange}
            placeholder="Passcode"
          />
          <input
            className="sk-input contrast"
            type="password"
            value={passcodeConfirmation}
            onChange={handleConfirmPasscodeChange}
            placeholder="Confirm Passcode"
          />
          <button className="sn-button small info mt-2" onClick={submitPasscodeForm}>
            Set Passcode
          </button>
          <button className="sn-button small outlined ml-2" onClick={() => setShowPasscodeForm(false)}>
            Cancel
          </button>
        </form>
      )}
      {hasPasscode && !showPasscodeForm && (
        <>
          <div className="sk-panel-section-subtitle info">Passcode lock is enabled</div>
          <div className="sk-notification contrast">
            <div className="sk-notification-title">Options</div>
            <div className="sk-notification-text">
              <div className="sk-panel-row">
                <div className="sk-horizontal-group">
                  <div className="sk-h4 sk-bold">Autolock</div>
                  {passcodeAutoLockOptions.map(option => {
                    return (
                      <a
                        className={`sk-a info ${option.value === selectedAutoLockInterval ? 'boxed' : ''}`}
                        onClick={() => selectAutoLockInterval(option.value)}>
                        {option.label}
                      </a>
                    );
                  })}
                </div>
              </div>
              <div className="sk-p">The autolock timer begins when the window or tab loses focus.</div>
              <div className="sk-panel-row" />
              <a className="sk-a info sk-panel-row condensed" onClick={changePasscodePressed}>
                Change Passcode
              </a>
              <a className="sk-a danger sk-panel-row condensed" onClick={removePasscodePressed}>
                Remove Passcode
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
});

export default PasscodeLock;
