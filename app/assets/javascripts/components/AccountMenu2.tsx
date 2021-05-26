import { observer } from 'mobx-react-lite';
import { toDirective } from '@/components/utils';
import { AppState } from '@/ui_models/app_state';
import { WebApplication } from '@/ui_models/application';
import { useEffect, useRef, useState } from 'preact/hooks';

import { User } from '@standardnotes/snjs/dist/@types/services/api/responses';
import { isDesktopApplication } from '@/utils';
import { storage, StorageKey } from '@Services/localStorage';
import { disableErrorReporting, enableErrorReporting, errorReportingId } from '@Services/errorReporting';
import { ConfirmSignoutDirective } from '@/components/ConfirmSignoutModal';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
// interface Props {} // TODO: Vardan: implement props and remove `eslint-disable`
type Props = {
  appState: AppState;
  application: WebApplication;
};

// const HistoryMenu = observer((props: Props) => {
// const AccountMenu = observer((props) => {
const AccountMenu = observer(({ appState, application }: Props) => {

  const passcodeInput = useRef<HTMLInputElement>();
  // const { user, formData } = application;
  // const [user, setUser] = useState(null); // TODO: Vardan: set correct type and initial value
  const [user, setUser] = useState<User | undefined>(undefined); // TODO: Vardan: set correct type and initial value
  // TODO: Vardan `showLogin` and `showRegister` were in `formData` in Angular code, check whether I need to write similarly
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [password, setPassword] = useState<string | undefined>(undefined);
  const [passwordConfirmation, setPasswordConfirmation] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState('');
  const [syncError, setSyncError] = useState('');
  const [server, setServer] = useState('');
  const [notesAndTagsCount, setNotesAndTagsCount] = useState(0);
  const [isEncryptionEnabled, setIsEncryptionEnabled] = useState(false);
  const [encryptionStatusString, setEncryptionStatusString] = useState('');
  const [hasProtections, setHasProtections] = useState(false);
  const [protectionsDisabledUntil, setProtectionsDisabledUntil] = useState<string | null>(null);
  const [hasPasscode, setHasPasscode] = useState(false);
  const [canAddPasscode, setCanAddPasscode] = useState(false);
  const [showPasscodeForm, setShowPasscodeForm] = useState(false);
  const [keyStorageInfo, setKeyStorageInfo] = useState<string | null>(null);
  const [passcodeAutoLockOptions, setPasscodeAutoLockOptions] = useState<{value: number; label: string}[]>([]);
  const [selectedAutoLockInterval, setSelectedAutoLockInterval] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState<unknown>(false);
  const [isErrorReportingEnabled, setIsErrorReportingEnabled] = useState(false);
  const [appVersion, setAppVersion] = useState(''); // TODO: Vardan: figure out how to get `appVersion` similar to original code
  const [showBetaWarning, setShowBetaWarning] = useState(false);


  // TODO: Vardan: in original code initial value of `backupEncrypted` is `hasUser || hasPasscode` -
  //  once I have those values here, set them as initial value
  const [isBackupEncrypted, setIsBackupEncrypted] = useState(false);
  const [isSyncInProgress, setIsSyncInProgress] = useState(false);


  const errorReportingIdValue = errorReportingId();

  /*
  const displayRegistrationForm = () => {
    console.log('display registration form!');
  };
  */
  const handleFormSubmit = () => {
    // TODO: Vardan: there is `novalidate` in Angular code, need to understand how to apply it here
    console.log('form submit');
  };

  const handleHostInputChange = () => {
    console.log('handle host input change');
  };

  const handleKeyPressKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleFormSubmit();
    }
  };

  const handleChangeStrictSignIn = () => {
    console.log('handleChangeStrictSignIn');
  };

  const handlePasswordChange = () => {
    console.log('handlePasswordChange');
  };

  const handlePasswordConfirmationChange = () => {
    console.log('handlePasswordConfirmationChange');
  };

  const handleChangeEphemeral = () => {
    console.log('change ephemeral');
    // TODO: Vardan: perhaps need to set some "global" value here
  };

  const handleMergeLocalData = () => {
    console.log('handleMergeLocalData');
  };

  const openPasswordWizard = () => {
    console.log('openPasswordWizard');
  };

  const openSessionsModal = () => {
    console.log('openSessionsModal');
  };

  const getEncryptionStatusForNotes = () => {
    console.log('implement `getEncryptionStatusForNotes`');
    return '';
  };

  const enableProtections = () => {
    console.log('enableProtections');
  };

  const handleAddPassCode = () => {
    console.log('handleAddPassCode');
  };

  const submitPasscodeForm = () => {
    console.log('submitPasscodeForm');
  };

  const handlePasscodeChange = () => {
    console.log('handlePasscodeChange');
  };

  const handleConfirmPasscodeChange = () => {
    console.log('handleConfirmPasscodeChange');
  };

  const selectAutoLockInterval = (interval: number) => {
    console.log('selectAutoLockInterval', interval);
  };

  const disableBetaWarning = () => {
    console.log('disableBetaWarning');
  };

  const hidePasswordForm = () => {
    setShowLogin(false);
    setShowRegister(false);
    setPassword(undefined);
    setPasswordConfirmation(undefined);
  };

  const signOut = () => {
    console.log('signOut');
  };

  // TODO: Vardan: the name `changePasscodePressed` comes from original code; it is very similar to my `handlePasscodeChange`.
  //  Check if `handlePasscodeChange` is not required, remove it and rename `changePasscodePressed` to `handlePasscodeChange`
  const changePasscodePressed = () => {
    console.log('changePasscodePressed');
  };

  // TODO: Vardan: the name `removePasscodePressed` comes from original code;
  //  Check if I rename`changePasscodePressed` to `handlePasscodeChange`, also rename `removePasscodePressed` to `handleRemovePasscode`
  const removePasscodePressed = () => {
    console.log('removePasscodePressed');
  };

  const downloadDataArchive = () => {
    console.log('downloadDataArchive');
  };

  const importFileSelected = () => {
    console.log('importFileSelected');
  };

  const toggleErrorReportingEnabled = () => {
    if (isErrorReportingEnabled) {
      disableErrorReporting();
    } else {
      enableErrorReporting();
    }
    if (!isSyncInProgress) {
      window.location.reload();
    }
  };

  const openErrorReportingDialog = () => {
    console.log('openErrorReportingDialog');
  };

  const handleClose = () => {
    console.log('close this');
  };




  useEffect(() => {
    // TODO: Vardan: get the real count
    setNotesAndTagsCount(1);
  }, []);

  useEffect(() => {
    setIsErrorReportingEnabled( storage.get(StorageKey.DisableErrorReporting) === false);
  }, []);

  /*
  useEffect(() => {
    setAppVersion(`v${((window as any).electronAppVersion || appVersion)}`);
  }, [appVersion]);
  */

  /*
  const { searchOptions } = appState;

  const {
    includeProtectedContents,
    includeArchived,
    includeTrashed,
  } = searchOptions;
  */

  return (
    <div style={{
      top: '-250px',
      right: '-450px',
      width: '100px',
      height: '100px',
      background: 'green',
      zIndex: 100,
      position: 'absolute'
    }}>
      <div className='sn-component'>
        <div id='account-panel-vardan' className='sk-panel'>
          <div className='sk-panel-header'>
            <div className='sk-panel-header-title'>Account</div>
            <a className='sk-a info close-button' onClick={handleClose}>Close</a>
          </div>
          <div className='sk-panel-content'>
            {!user && !showLogin && !showRegister && (
              <div className='sk-panel-section sk-panel-hero'>
                <div className='sk-panel-row'>
                  <div className='sk-h1'>Sign in or register to enable sync and end-to-end encryption.</div>
                </div>
                <div className='flex my-1'>
                  <button
                    className='sn-button info flex-grow text-base py-3 mr-1.5'
                    onClick={() => setShowLogin(true)}
                  >
                    Sign In
                  </button>
                  <button
                    className='sn-button info flex-grow text-base py-3 ml-1.5'
                    onClick={() => setShowRegister(true)}
                  >
                    Register
                  </button>
                </div>
                <div className='sk-panel-row sk-p'>
                  Standard Notes is free on every platform, and comes<br />
                  standard with sync and encryption.
                </div>
              </div>
            )}
            {(showLogin || showRegister) && (
              <div className='sk-panel-section'>
                <div className='sk-panel-section-title'>
                  {showLogin ? 'Sign In' : 'Register'}
                </div>
                <form className='sk-panel-form' onSubmit={handleFormSubmit}>
                  <div className='sk-panel-section'>
                    {/* TODO: Vardan: there are `should-focus` and `sn-autofocus`, implement them */}
                    <input className='sk-input contrast'
                           name='email'
                           type='email'
                           placeholder='Email'
                           required
                           spellCheck={false} />
                    <input className='sk-input contrast'
                           name='password'
                           type='password'
                           placeholder='Password'
                           required
                           onKeyPress={handleKeyPressKeyDown}
                           onKeyDown={handleKeyPressKeyDown}
                           value={password}
                           onChange={handlePasswordChange}
                    />
                    {showRegister &&
                    <input className='sk-input contrast'
                           name='password_conf'
                           type='password'
                           placeholder='Confirm Password' required
                           onKeyPress={handleKeyPressKeyDown}
                           onKeyDown={handleKeyPressKeyDown}
                           value={passwordConfirmation}
                           onChange={handlePasswordConfirmationChange}
                    />}
                    <div className='sk-panel-row' />
                    <a className="sk-panel-row sk-bold" onClick={() => {setShowAdvanced(showAdvanced => !showAdvanced)}}>
                      Advanced Options
                    </a>
                  </div>
                  {showAdvanced && (
                    <div className="sk-notification unpadded contrast advanced-options sk-panel-row">
                      <div className="sk-panel-column stretch">
                        <div className="sk-notification-title sk-panel-row padded-row">
                          Advanced Options
                        </div>
                        <div className="bordered-row padded-row">
                          <label className="sk-label">Sync Server Domain</label>
                          <input className="sk-input sk-base"
                                 name="server"
                                 placeholder="Server URL"
                                 onChange={handleHostInputChange}
                                 required
                          />
                        </div>
                        {showLogin && (
                          <label className="sk-label padded-row sk-panel-row justify-left">
                            <div className="sk-horizontal-group tight">
                              <input className="sk-input" type="checkbox" onChange={handleChangeStrictSignIn} />
                              <p className="sk-p">Use strict sign in</p>
                              <span>
                                <a className="info"
                                   href="https://standardnotes.org/help/security" rel="noopener"
                                   target="_blank"
                                >
                                  (Learn more)
                                </a>
                              </span>
                            </div>
                          </label>
                        )}
                      </div>
                    </div>
                  )}
                  {!isAuthenticating && (
                    <div className="sk-panel-section.form-submit">
                      <button className="sn-button info text-base py-3 text-center" type="submit" disabled={isAuthenticating}>
                        {showLogin ? "Sign In" : "Register"}
                      </button>
                    </div>
                  )}
                  {showRegister && (
                    <div className="sk-notification neutral">
                      <div className="sk-notification-title">No Password Reset.</div>
                      <div className="sk-notification-text">
                        Because your notes are encrypted using your password,<br />
                        Standard Notes does not have a password reset option.<br />
                        You cannot forget your password.
                      </div>
                    </div>
                  )}
                  {status && (
                    <div className="sk-panel-section no-bottom-pad">
                      <div className="sk-horizontal-group">
                        <div className="sk-spinner small neutral">
                          <div className="sk-label">{status}</div>
                        </div>
                      </div>
                    </div>
                  )}
                  {!isAuthenticating && (
                    <div className="sk-panel-section no-bottom-pad">
                      <label className="sk-panel-row justify-left">
                        <div className="sk-horizontal-group tight">
                          <input type="checkbox" onChange={handleChangeEphemeral} />
                          <p className="sk-p">Stay signed in</p>
                        </div>
                      </label>
                      {notesAndTagsCount > 0 && (
                        <label className="sk-panel-row.justify-left">
                          <div className="sk-horizontal-group tight">
                            <input type="checkbox" onChange={handleMergeLocalData} />
                            <p className="sk-p">Merge local data ({notesAndTagsCount}) notes and tags</p>
                          </div>
                        </label>
                      )}
                    </div>
                  )}
                </form>
              </div>
            )}
            {!showLogin && !showRegister && (
              <div>
              {user && (
                <>
                  <div className="sk-panel-section">
                    {syncError && (
                      <>
                      <div className="sk-notification danger">
                        <div className="sk-notification-title">Sync Unreachable</div>
                        <div className="sk-notification-text">
                          Hmm...we can't seem to sync your account.<br />
                          The reason: {syncError}
                        </div>
                        <a
                          className="sk-a info-contrast sk-bold sk-panel-row"
                          href='https://standardnotes.org/help'
                          rel='noopener'
                          target='_blank'
                        >
                          Need help?
                        </a>
                      </div>
                      <div className="sk-panel-row">
                        <div className="sk-panel-column">
                          <div className="sk-h1 sk-bold wrap">
                            {user.email}
                          </div>
                          <div className="sk-subtitle neutral">
                            {server}
                          </div>
                        </div>
                      </div>
                        <div className="sk-panel-row" />
                        <a className="sk-a info sk-panel-row condensed" onClick={openPasswordWizard}>
                          Change Password
                          (Vardan) reached here
                        </a>
                        <a className="sk-a info sk-panel-row condensed" onClick={openSessionsModal}>
                          Manage Sessions
                        </a>
                      </>
                    )}
                  </div>
                  <div className="sk-panel-section">
                    <div className="sk-panel-section-title">
                      Encryption
                    </div>
                    {isEncryptionEnabled && (
                      <div className="sk-panel-section-subtitle info">
                        {getEncryptionStatusForNotes()}
                      </div>
                    )}
                    <p className="sk-p">
                      {encryptionStatusString}
                    </p>
                  </div>
                  {hasProtections && (
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
                        Actions like viewing protected notes, exporting decrypted backups,<br />
                        or revoking an active session, require additional authentication<br />
                        like entering your account password or application passcode.
                      </p>
                      {protectionsDisabledUntil && (
                        <div className="sk-panel-row">
                          <button className="sn-button small.info" onClick={enableProtections}>
                            Enable protections
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="sk-panel-section">
                    <div className="sk-panel-section-title">Passcode Lock</div>
                    {!hasPasscode && (
                      <div>
                        {canAddPasscode && (
                          <>
                            {showPasscodeForm && (
                              <div className="sk-panel-row">
                                <button className="sn-button.small.info" onClick={handleAddPassCode}>
                                  Add Passcode
                                </button>
                              </div>
                            )}
                            <p className="sk-p">
                              Add a passcode to lock the application and<br />
                              encrypt on-device key storage.
                            </p>
                              {keyStorageInfo && (
                                <p>{keyStorageInfo}</p>
                              )}
                          </>
                        )}
                        {!canAddPasscode && (
                          <p className="sk-p">
                            Adding a passcode is not supported in temporary sessions. Please sign<br />
                            out, then sign back in with the "Stay signed in" option checked.
                          </p>
                        )}
                      </div>
                    )}
                    {showPasscodeForm && (
                      <form className="sk-panel-form" onSubmit={submitPasscodeForm}>
                        <div className="sk-panel-row" />
                        {/* TODO: Vardan: there are `should-focus` and `sn-autofocus`, implement them */}
                        <input
                          className="sk-input contrast"
                          type="password"
                          ref={passcodeInput}
                          onChange={handlePasscodeChange}
                          placeholder="Passcode"
                        />
                        <input
                          className="sk-input contrast"
                          type="password"
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
                                      className={option.value === selectedAutoLockInterval ? "boxed" : ""}
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
                  {!isLoading && (
                    <div className="sk-panel-section">
                      <div className="sk-panel-section-title">Data Backups</div>
                      <div className="sk-p">Download a backup of all your data.</div>
                      {isEncryptionEnabled && (
                        <form className="sk-panel-form sk-panel-row">
                          <div className="sk-input-group" />
                          <label className="sk-horizontal-group tight">
                            <input
                              type="radio"
                              onChange={() => setIsBackupEncrypted(true)}
                              value="true"
                              checked={isBackupEncrypted}
                            />
                            <p className="sk-p">Encrypted</p>
                          </label>
                          <label className="sk-horizontal-group tight">
                            <input
                              type="radio"
                              onChange={() => setIsBackupEncrypted(false)}
                              value="false"
                              checked={!isBackupEncrypted}
                            />
                            <p className="sk-p">Decrypted</p>
                          </label>
                        </form>
                      )}
                      <div className="sk-panel-row" />
                      <div className="flex">
                        <button className="sn-button small info" onClick={downloadDataArchive}>Download Backup</button>
                        <label className="sn-button small flex items-center info ml-2">
                          <input
                            type="file"
                            onChange={importFileSelected}
                            style={{display: "none"}}
                          />
                          Import Backup
                        </label>
                      </div>
                      {isDesktopApplication && (
                        <p className="mt-5">
                          Backups are automatically created on desktop and can be managed<br />
                          via the "Backups" top-level menu.
                        </p>
                      )}
                      <div className="sk-panel-row" />
                      {isLoading && (
                        <div className="sk-spinner small info" />
                      )}
                    </div>
                  )}
                  <div className="sk-panel-section">
                    <div className="sk-panel-section-title">Error Reporting</div>
                    <div className="sk-panel-section-subtitle info">
                      Automatic error reporting is {isErrorReportingEnabled ? 'enabled' : 'disabled'}
                    </div>
                    <p className="sk-p">
                      Help us improve Standard Notes by automatically submitting<br />
                      anonymized error reports.
                    </p>
                    {errorReportingIdValue && (
                      <>
                        <p className="sk-p selectable">
                          Your random identifier is<br />
                          strong {errorReportingIdValue}
                        </p>
                        <p className="sk-p">
                          Disabling error reporting will remove that identifier from your<br />
                          local storage, and a new identifier will be created should you<br />
                          decide to enable error reporting again in the future.
                        </p>
                      </>
                    )}
                    <div className="sk-panel-row">
                      <button className="sn-button small info" onClick={toggleErrorReportingEnabled}>
                        {isErrorReportingEnabled ? 'Disable' : 'Enable'} Error Reporting
                      </button>
                    </div>
                    <div className="sk-panel-row">
                      <a className="sk-a" onClick={openErrorReportingDialog}>What data is being sent?</a>
                    </div>
                  </div>
                </>
              )}
              </div>
            )}
          </div>
          {
            // TODO: Vardan: check whether this works
            () => ConfirmSignoutDirective
          }
          <div className="sk-panel-footer">
            <div className="sk-panel-row">
              <div className="sk-p left neutral">
                <span>{appVersion}</span>
                {showBetaWarning && (
                  <span>
                    <a className="sk-a" onClick={disableBetaWarning}>Hide beta warning</a>
                  </span>
                )}
              </div>
              {(showLogin || showRegister) && (
                <a className="sk-a right" onClick={hidePasswordForm}>Cancel</a>
              )}
              {!showLogin && !showRegister && (
                <a className="sk-a right danger capitalize" onClick={signOut}>
                  {user ? "Sign out" : "Clear session data"}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export const AccountMenu2 = toDirective<Props>(
  AccountMenu
);
