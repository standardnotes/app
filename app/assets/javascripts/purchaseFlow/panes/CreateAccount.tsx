import { Button } from '@/components/Button';
import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
import { PurchaseFlowPane } from '@/ui_models/app_state/purchase_flow_state';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import Illustration from '../../../svg/create-account-illustration.svg';
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

export const CreateAccount: FunctionComponent<Props> = observer(
  ({ appState, application }) => {
    const { setCurrentPane } = appState.purchaseFlow;
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isCreatingAccount, setIsCreatingAccount] = useState(false);
    const [isEmailInvalid, setIsEmailInvalid] = useState(false);
    const [isPasswordNotMatching, setIsPasswordNotMatching] = useState(false);

    const emailInputRef = useRef<HTMLInputElement>();
    const passwordInputRef = useRef<HTMLInputElement>();
    const confirmPasswordInputRef = useRef<HTMLInputElement>();

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
      }
    };

    const handleConfirmPasswordChange = (e: Event) => {
      if (e.target instanceof HTMLInputElement) {
        setConfirmPassword(e.target.value);
        setIsPasswordNotMatching(false);
      }
    };

    const handleSignInInstead = () => {
      setCurrentPane(PurchaseFlowPane.SignIn);
    };

    const handleCreateAccount = async () => {
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

      if (!confirmPassword) {
        confirmPasswordInputRef?.current.focus();
        return;
      }

      if (password !== confirmPassword) {
        setConfirmPassword('');
        setIsPasswordNotMatching(true);
        confirmPasswordInputRef?.current.focus();
        return;
      }

      setIsCreatingAccount(true);

      try {
        const response = await application.register(email, password);
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
        application.alertService.alert(err as string);
      } finally {
        setIsCreatingAccount(false);
      }
    };

    return (
      <div className="flex items-center">
        <Circle className="absolute w-8 h-8 top-40% -left-28" />
        <BlueDot className="absolute w-4 h-4 top-35% -left-10" />
        <Diamond className="absolute w-26 h-26 -bottom-5 left-0 -translate-x-1/2 -z-index-1" />

        <Circle className="absolute w-8 h-8 bottom-35% -right-20" />
        <BlueDot className="absolute w-4 h-4 bottom-25% -right-10" />
        <Diamond className="absolute w-18 h-18 top-0 -right-2 translate-x-1/2 -z-index-1" />

        <div className="mr-12">
          <h1 className="mt-0 mb-2 text-2xl">Create your free account</h1>
          <div className="mb-4 font-medium text-sm">
            to continue to Standard Notes.
          </div>
          <form onSubmit={handleCreateAccount}>
            <div className="flex flex-col">
              <FloatingLabelInput
                className={`min-w-90 ${isEmailInvalid ? 'mb-2' : 'mb-4'}`}
                id="purchase-sign-in-email"
                type="email"
                label="Email"
                value={email}
                onChange={handleEmailChange}
                ref={emailInputRef}
                disabled={isCreatingAccount}
                isInvalid={isEmailInvalid}
              />
              {isEmailInvalid ? (
                <div className="color-dark-red mb-4">
                  Please provide a valid email.
                </div>
              ) : null}
              <FloatingLabelInput
                className="min-w-90 mb-4"
                id="purchase-create-account-password"
                type="password"
                label="Password"
                value={password}
                onChange={handlePasswordChange}
                ref={passwordInputRef}
                disabled={isCreatingAccount}
              />
              <FloatingLabelInput
                className={`min-w-90 ${
                  isPasswordNotMatching ? 'mb-2' : 'mb-4'
                }`}
                id="create-account-confirm"
                type="password"
                label="Repeat password"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                ref={confirmPasswordInputRef}
                disabled={isCreatingAccount}
                isInvalid={isPasswordNotMatching}
              />
              {isPasswordNotMatching ? (
                <div className="color-dark-red mb-4">
                  Passwords don't match. Please try again.
                </div>
              ) : null}
            </div>
          </form>
          <div className="flex justify-between">
            <button
              onClick={handleSignInInstead}
              disabled={isCreatingAccount}
              className="p-0 bg-default border-0 font-medium color-info cursor-pointer hover:underline"
            >
              Sign in instead
            </button>
            <Button
              className="py-2.5"
              type="primary"
              label={
                isCreatingAccount ? 'Creating account...' : 'Create account'
              }
              onClick={handleCreateAccount}
              disabled={isCreatingAccount}
            />
          </div>
        </div>
        <Illustration />
      </div>
    );
  }
);
