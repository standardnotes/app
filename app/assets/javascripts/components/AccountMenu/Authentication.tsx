import { confirmDialog } from '@Services/alertService';
import {
  STRING_ACCOUNT_MENU_UNCHECK_MERGE,
  STRING_GENERATING_LOGIN_KEYS,
  STRING_GENERATING_REGISTER_KEYS,
  STRING_NON_MATCHING_PASSWORDS,
} from '@/strings';
import { JSXInternal } from 'preact/src/jsx';
import TargetedEvent = JSXInternal.TargetedEvent;
import TargetedKeyboardEvent = JSXInternal.TargetedKeyboardEvent;
import { WebApplication } from '@/ui_models/application';
import { useEffect, useRef, useState } from 'preact/hooks';
import TargetedMouseEvent = JSXInternal.TargetedMouseEvent;
import { observer } from 'mobx-react-lite';
import { AppState } from '@/ui_models/app_state';

type Props = {
  application: WebApplication;
  appState: AppState;
};

const Authentication = observer(({ application, appState }: Props) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState<string>('');
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [isEmailFocused, setIsEmailFocused] = useState(false);

  const [isEphemeral, setIsEphemeral] = useState(false);
  const [isStrictSignIn, setIsStrictSignIn] = useState(false);
  const [shouldMergeLocal, setShouldMergeLocal] = useState(true);

  const {
    server,
    notesAndTagsCount,
    showSignIn,
    showRegister,
    setShowSignIn,
    setShowRegister,
    setServer,
    closeAccountMenu,
  } = appState.accountMenu;

  useEffect(() => {
    if (isEmailFocused) {
      emailInputRef.current.focus();
      setIsEmailFocused(false);
    }
  }, [isEmailFocused]);

  // Reset password and confirmation fields when hiding the form
  useEffect(() => {
    if (!showSignIn && !showRegister) {
      setPassword('');
      setPasswordConfirmation('');
    }
  }, [showSignIn, showRegister]);

  const handleHostInputChange = (event: TargetedEvent<HTMLInputElement>) => {
    const { value } = event.target as HTMLInputElement;
    setServer(value);
    application.setCustomHost(value);
  };

  const emailInputRef = useRef<HTMLInputElement>();
  const passwordInputRef = useRef<HTMLInputElement>();
  const passwordConfirmationInputRef = useRef<HTMLInputElement>();

  const handleSignInClick = () => {
    setShowSignIn(true);
    setIsEmailFocused(true);
  };

  const handleRegisterClick = () => {
    setShowRegister(true);
    setIsEmailFocused(true);
  };

  const blurAuthFields = () => {
    emailInputRef.current.blur();
    passwordInputRef.current.blur();
    passwordConfirmationInputRef.current?.blur();
  };

  const signin = async () => {
    setStatus(STRING_GENERATING_LOGIN_KEYS);
    setIsAuthenticating(true);

    const response = await application.signIn(
      email,
      password,
      isStrictSignIn,
      isEphemeral,
      shouldMergeLocal
    );
    const error = response.error;
    if (!error) {
      setIsAuthenticating(false);
      setPassword('');
      setShowSignIn(false);

      closeAccountMenu();
      return;
    }

    setShowSignIn(true);
    setStatus(undefined);
    setPassword('');

    if (error.message) {
      await application.alertService.alert(error.message);
    }

    setIsAuthenticating(false);
  };

  const register = async () => {
    if (passwordConfirmation !== password) {
      application.alertService.alert(STRING_NON_MATCHING_PASSWORDS);
      return;
    }
    setStatus(STRING_GENERATING_REGISTER_KEYS);
    setIsAuthenticating(true);

    const response = await application.register(
      email,
      password,
      isEphemeral,
      shouldMergeLocal
    );

    const error = response.error;
    if (error) {
      setStatus(undefined);
      setIsAuthenticating(false);

      application.alertService.alert(error.message);
    } else {
      setIsAuthenticating(false);
      setShowRegister(false);
      closeAccountMenu();
    }
  };

  const handleAuthFormSubmit = (
    event:
      | TargetedEvent<HTMLFormElement>
      | TargetedMouseEvent<HTMLButtonElement>
      | TargetedKeyboardEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();

    if (!email || !password) {
      return;
    }

    blurAuthFields();

    if (showSignIn) {
      signin();
    } else {
      register();
    }
  };

  const handleKeyPressKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleAuthFormSubmit(event as TargetedKeyboardEvent<HTMLButtonElement>);
    }
  };

  const handlePasswordChange = (event: TargetedEvent<HTMLInputElement>) => {
    const { value } = event.target as HTMLInputElement;
    setPassword(value);
  };

  const handleEmailChange = (event: TargetedEvent<HTMLInputElement>) => {
    const { value } = event.target as HTMLInputElement;
    setEmail(value);
  };

  const handlePasswordConfirmationChange = (
    event: TargetedEvent<HTMLInputElement>
  ) => {
    const { value } = event.target as HTMLInputElement;
    setPasswordConfirmation(value);
  };

  const handleMergeLocalData = async (
    event: TargetedEvent<HTMLInputElement>
  ) => {
    const { checked } = event.target as HTMLInputElement;

    setShouldMergeLocal(checked);
    if (!checked) {
      const confirmResult = await confirmDialog({
        text: STRING_ACCOUNT_MENU_UNCHECK_MERGE,
        confirmButtonStyle: 'danger',
      });
      setShouldMergeLocal(!confirmResult);
    }
  };

  return (
    <>
      {!application.hasAccount() && !showSignIn && !showRegister && (
        <div className="sk-panel-section sk-panel-hero">
          <div className="sk-panel-row">
            <div className="sk-h1">
              Sign in or register to enable sync and end-to-end encryption.
            </div>
          </div>
          <div className="flex my-1">
            <button
              className="sn-button info flex-grow text-base py-3 mr-1.5"
              onClick={handleSignInClick}
            >
              Sign In
            </button>
            <button
              className="sn-button info flex-grow text-base py-3 ml-1.5"
              onClick={handleRegisterClick}
            >
              Register
            </button>
          </div>
          <div className="sk-panel-row sk-p">
            Standard Notes is free on every platform, and comes standard with
            sync and encryption.
          </div>
        </div>
      )}
      {(showSignIn || showRegister) && (
        <div className="sk-panel-section">
          <div className="sk-panel-section-title">
            {showSignIn ? 'Sign In' : 'Register'}
          </div>
          <form
            className="sk-panel-form"
            onSubmit={handleAuthFormSubmit}
            noValidate
          >
            <div className="sk-panel-section">
              <input
                className="sk-input contrast"
                name="email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="Email"
                required
                spellcheck={false}
                ref={emailInputRef}
              />
              <input
                className="sk-input contrast"
                name="password"
                type="password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="Password"
                required
                onKeyPress={handleKeyPressKeyDown}
                onKeyDown={handleKeyPressKeyDown}
                ref={passwordInputRef}
              />
              {showRegister && (
                <input
                  className="sk-input contrast"
                  name="password_conf"
                  type="password"
                  placeholder="Confirm Password"
                  required
                  onKeyPress={handleKeyPressKeyDown}
                  onKeyDown={handleKeyPressKeyDown}
                  value={passwordConfirmation}
                  onChange={handlePasswordConfirmationChange}
                  ref={passwordConfirmationInputRef}
                />
              )}
              <div className="sk-panel-row" />
              <button
                type="button"
                className="sk-a info font-bold text-left p-0 cursor-pointer hover:underline mr-1 ml-1"
                onClick={() => {
                  setShowAdvanced(!showAdvanced);
                }}
              >
                Advanced Options
              </button>
            </div>
            {showAdvanced && (
              <div className="sk-notification unpadded contrast advanced-options sk-panel-row">
                <div className="sk-panel-column stretch">
                  <div className="sk-notification-title sk-panel-row padded-row">
                    Advanced Options
                  </div>
                  <div className="bordered-row padded-row">
                    <label className="sk-label">Sync Server Domain</label>
                    <input
                      className="sk-input sk-base"
                      name="server"
                      placeholder="Server URL"
                      onChange={handleHostInputChange}
                      value={server}
                      required
                    />
                  </div>
                  {showSignIn && (
                    <label className="sk-label padded-row sk-panel-row justify-left">
                      <div className="sk-horizontal-group tight cursor-pointer">
                        <input
                          className="sk-input"
                          type="checkbox"
                          checked={isStrictSignIn}
                          onChange={() =>
                            setIsStrictSignIn((prevState) => !prevState)
                          }
                        />
                        <p className="sk-p">Use strict sign in</p>
                        <span>
                          <a
                            className="info"
                            href="https://standardnotes.com/help/security"
                            rel="noopener"
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
              <div className="sk-panel-section form-submit">
                <button
                  className="sn-button info text-base py-3 text-center"
                  type="submit"
                  disabled={isAuthenticating}
                >
                  {showSignIn ? 'Sign In' : 'Register'}
                </button>
              </div>
            )}
            {showRegister && (
              <div className="sk-notification neutral">
                <div className="sk-notification-title">No Password Reset.</div>
                <div className="sk-notification-text">
                  Because your notes are encrypted using your password, Standard
                  Notes does not have a password reset option. You cannot forget
                  your password.
                </div>
              </div>
            )}
            {status && (
              <div className="sk-panel-section no-bottom-pad">
                <div className="sk-horizontal-group">
                  <div className="sk-spinner small neutral" />
                  <div className="sk-label">{status}</div>
                </div>
              </div>
            )}
            {!isAuthenticating && (
              <div className="sk-panel-section no-bottom-pad">
                <label className="sk-panel-row justify-left">
                  <div className="sk-horizontal-group tight cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!isEphemeral}
                      onChange={() => setIsEphemeral((prevState) => !prevState)}
                    />
                    <p className="sk-p">Stay signed in</p>
                  </div>
                </label>
                {notesAndTagsCount > 0 && (
                  <label className="sk-panel-row justify-left">
                    <div className="sk-horizontal-group tight cursor-pointer">
                      <input
                        type="checkbox"
                        checked={shouldMergeLocal}
                        onChange={handleMergeLocalData}
                      />
                      <p className="sk-p">
                        Merge local data ({notesAndTagsCount}) notes and tags
                      </p>
                    </div>
                  </label>
                )}
              </div>
            )}
          </form>
        </div>
      )}
    </>
  );
});

export default Authentication;
