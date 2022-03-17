import { Button } from '@/components/Button';
import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
import { PurchaseFlowPane } from '@/ui_models/app_state/purchase_flow_state';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { FloatingLabelInput } from '@/components/FloatingLabelInput';
import { isEmailValid } from '@/utils';
import { loadPurchaseFlowUrl } from '../PurchaseFlowWrapper';
import {
  BlueDotIcon,
  CircleIcon,
  DiamondIcon,
  CreateAccountIllustration,
} from '@standardnotes/stylekit';

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

    const emailInputRef = useRef<HTMLInputElement>(null);
    const passwordInputRef = useRef<HTMLInputElement>(null);
    const confirmPasswordInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      if (emailInputRef.current) emailInputRef.current?.focus();
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

    const subscribeWithoutAccount = () => {
      loadPurchaseFlowUrl(application).catch((err) => {
        console.error(err);
        application.alertService.alert(err);
      });
    };

    const handleCreateAccount = async () => {
      if (!email) {
        emailInputRef?.current?.focus();
        return;
      }

      if (!isEmailValid(email)) {
        setIsEmailInvalid(true);
        emailInputRef?.current?.focus();
        return;
      }

      if (!password) {
        passwordInputRef?.current?.focus();
        return;
      }

      if (!confirmPassword) {
        confirmPasswordInputRef?.current?.focus();
        return;
      }

      if (password !== confirmPassword) {
        setConfirmPassword('');
        setIsPasswordNotMatching(true);
        confirmPasswordInputRef?.current?.focus();
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
        <CircleIcon className="absolute w-8 h-8 top-40% -left-28" />
        <BlueDotIcon className="absolute w-4 h-4 top-35% -left-10" />
        <DiamondIcon className="absolute w-26 h-26 -bottom-5 left-0 -translate-x-1/2 -z-index-1" />

        <CircleIcon className="absolute w-8 h-8 bottom-35% -right-20" />
        <BlueDotIcon className="absolute w-4 h-4 bottom-25% -right-10" />
        <DiamondIcon className="absolute w-18 h-18 top-0 -right-2 translate-x-1/2 -z-index-1" />

        <div className="mr-12 md:mr-0">
          <h1 className="mt-0 mb-2 text-2xl">Create your free account</h1>
          <div className="mb-4 font-medium text-sm">
            to continue to Standard Notes.
          </div>
          <form onSubmit={handleCreateAccount}>
            <div className="flex flex-col">
              <FloatingLabelInput
                className={`min-w-90 xs:min-w-auto ${
                  isEmailInvalid ? 'mb-2' : 'mb-4'
                }`}
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
                className="min-w-90 xs:min-w-auto mb-4"
                id="purchase-create-account-password"
                type="password"
                label="Password"
                value={password}
                onChange={handlePasswordChange}
                ref={passwordInputRef}
                disabled={isCreatingAccount}
              />
              <FloatingLabelInput
                className={`min-w-90 xs:min-w-auto ${
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
          <div className="flex xs:flex-col-reverse xs:items-start items-center justify-between">
            <div className="flex flex-col">
              <button
                onClick={handleSignInInstead}
                disabled={isCreatingAccount}
                className="flex items-start p-0 mb-2 bg-default border-0 font-medium color-info cursor-pointer hover:underline"
              >
                Sign in instead
              </button>
              <button
                onClick={subscribeWithoutAccount}
                disabled={isCreatingAccount}
                className="flex items-start p-0 bg-default border-0 font-medium color-info cursor-pointer hover:underline"
              >
                Subscribe without account
              </button>
            </div>
            <Button
              className="py-2.5 xs:mb-4"
              type="primary"
              label={
                isCreatingAccount ? 'Creating account...' : 'Create account'
              }
              onClick={handleCreateAccount}
              disabled={isCreatingAccount}
            />
          </div>
        </div>
        <CreateAccountIllustration className="md:hidden" />
      </div>
    );
  }
);
