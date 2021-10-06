import { Button } from '@/components/Button';
import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
import { PurchaseFlowPane } from '@/ui_models/app_state/purchase_flow_state';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { useState } from 'preact/hooks';
import Illustration from '../../../svg/create-account-illustration.svg';

type Props = {
  appState: AppState;
  application: WebApplication;
};

const INPUT_CLASSNAME =
  'min-w-90 py-2.5 px-3 bg-default border-1 border-solid border-gray-300 rounded mb-3 placeholder-semibold text-input';

export const CreateAccount: FunctionComponent<Props> = observer(
  ({ appState }) => {
    const { setCurrentPane } = appState.purchaseFlow;
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleEmailChange = (e: Event) => {
      if (e.target instanceof HTMLInputElement) {
        setEmail(e.target.value);
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
      }
    };

    const handleLogInInstead = () => {
      setCurrentPane(PurchaseFlowPane.SignIn);
    };

    const handleCreateAccount = () => {
      /** @TODO */
    };

    return (
      <div className="flex items-center">
        <div className="mr-12">
          <h1 className="mt-0 mb-2 text-2xl">Create your free account</h1>
          <div className="mb-4 font-medium text-sm">
            to continue to Standard Notes.
          </div>
          <div className="flex flex-col">
            <input
              placeholder="Email"
              className={INPUT_CLASSNAME}
              type="email"
              value={email}
              onChange={handleEmailChange}
            />
            <input
              placeholder="Password"
              className={INPUT_CLASSNAME}
              type="password"
              value={password}
              onChange={handlePasswordChange}
            />
            <input
              placeholder="Repeat password"
              className={INPUT_CLASSNAME}
              type="password"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
            />
          </div>
          <div className="flex justify-between">
            <button
              onClick={handleLogInInstead}
              className="p-0 bg-default border-0 font-semibold color-info cursor-pointer hover:underline"
            >
              Log in instead
            </button>
            <Button
              className="py-3"
              type="primary"
              label="Create account"
              onClick={handleCreateAccount}
            />
          </div>
        </div>
        <Illustration />
      </div>
    );
  }
);
