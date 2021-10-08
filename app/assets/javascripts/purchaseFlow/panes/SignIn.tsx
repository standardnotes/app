import { Button } from '@/components/Button';
import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
import { PurchaseFlowPane } from '@/ui_models/app_state/purchase_flow_state';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import Circle from '../../../svg/circle-55.svg';
import BlueDot from '../../../svg/blue-dot.svg';
import Diamond from '../../../svg/diamond-with-horizontal-lines.svg';
import { FloatingLabelInput } from '@/components/FloatingLabelInput';
import { isEmailValid } from '@/utils';
import { loadPurchaseFlowUrl } from '../PurchaseFlowWrapper';

type Props = {
  appState: AppState;
  application: WebApplication;
};

export const SignIn: FunctionComponent<Props> = observer(
  ({ appState, application }) => {
    const { setCurrentPane } = appState.purchaseFlow;
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSigningIn, setIsSigningIn] = useState(false);
    const [isEmailInvalid, setIsEmailInvalid] = useState(false);
    const [isPasswordInvalid, setIsPasswordInvalid] = useState(false);
    const [otherErrorMessage, setOtherErrorMessage] = useState('');

    const emailInputRef = useRef<HTMLInputElement>();
    const passwordInputRef = useRef<HTMLInputElement>();

    useEffect(() => {
      if (emailInputRef.current) emailInputRef.current.focus();
    }, []);

    const handleEmailChange = (e: Event) => {
      if (e.target instanceof HTMLInputElement) {
        setEmail(e.target.value);
        setIsEmailInvalid(false);
      }
    };

    const handlePasswordChange = (e: Event) => {
      if (e.target instanceof HTMLInputElement) {
        setPassword(e.target.value);
        setIsPasswordInvalid(false);
        setOtherErrorMessage('');
      }
    };

    const handleCreateAccountInstead = () => {
      if (isSigningIn) return;
      setCurrentPane(PurchaseFlowPane.CreateAccount);
    };

    const handleSignIn = async () => {
      if (!email) {
        emailInputRef?.current.focus();
        return;
      }

      if (!isEmailValid(email)) {
        setIsEmailInvalid(true);
        emailInputRef?.current.focus();
        return;
      }

      if (!password) {
        passwordInputRef?.current.focus();
        return;
      }

      setIsSigningIn(true);

      try {
        const response = await application.signIn(email, password);
        if (response.error || response.data?.error) {
          throw new Error(
            response.error?.message || response.data?.error?.message
          );
        } else {
          loadPurchaseFlowUrl(application).catch((err) => {
            console.error(err);
            application.alertService.alert(err);
          });
        }
      } catch (err) {
        console.error(err);
        if ((err as Error).toString().includes('Invalid email or password')) {
          setIsSigningIn(false);
          setIsEmailInvalid(true);
          setIsPasswordInvalid(true);
          setOtherErrorMessage('Invalid email or password.');
          setPassword('');
        } else {
          application.alertService.alert(err as string);
        }
      }
    };

    return (
      <div className="flex items-center">
        <Circle className="absolute w-8 h-8 top-35% -left-56" />
        <BlueDot className="absolute w-4 h-4 top-30% -left-40" />
        <Diamond className="absolute w-26 h-26 -bottom-5 left-0 -translate-x-1/2 -z-index-1" />

        <Circle className="absolute w-8 h-8 bottom-30% -right-56" />
        <BlueDot className="absolute w-4 h-4 bottom-20% -right-44" />
        <Diamond className="absolute w-18 h-18 top-0 -right-2 translate-x-1/2 -z-index-1" />

        <div>
          <h1 className="mt-0 mb-2 text-2xl">Sign in</h1>
          <div className="mb-4 font-medium text-sm">
            to continue to Standard Notes.
          </div>
          <form onSubmit={handleSignIn}>
            <div className="flex flex-col">
              <FloatingLabelInput
                className={`min-w-90 ${
                  isEmailInvalid && !otherErrorMessage ? 'mb-2' : 'mb-4'
                }`}
                id="purchase-sign-in-email"
                type="email"
                label="Email"
                value={email}
                onChange={handleEmailChange}
                ref={emailInputRef}
                disabled={isSigningIn}
                isInvalid={isEmailInvalid}
              />
              {isEmailInvalid && !otherErrorMessage ? (
                <div className="color-dark-red mb-4">
                  Please provide a valid email.
                </div>
              ) : null}
              <FloatingLabelInput
                className={`min-w-90 ${otherErrorMessage ? 'mb-2' : 'mb-4'}`}
                id="purchase-sign-in-password"
                type="password"
                label="Password"
                value={password}
                onChange={handlePasswordChange}
                ref={passwordInputRef}
                disabled={isSigningIn}
                isInvalid={isPasswordInvalid}
              />
              {otherErrorMessage ? (
                <div className="color-dark-red mb-4">{otherErrorMessage}</div>
              ) : null}
            </div>
            <Button
              className={`${isSigningIn ? 'min-w-30' : 'min-w-24'} py-2.5 mb-5`}
              type="primary"
              label={isSigningIn ? 'Signing in...' : 'Sign in'}
              onClick={handleSignIn}
              disabled={isSigningIn}
            />
          </form>
          <div className="text-sm font-medium color-grey-1">
            Don’t have an account yet?{' '}
            <a
              className={`color-info ${
                isSigningIn ? 'cursor-not-allowed' : 'cursor-pointer '
              }`}
              onClick={handleCreateAccountInstead}
            >
              Create account
            </a>
          </div>
        </div>
      </div>
    );
  }
);
