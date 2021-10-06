import { Button } from '@/components/Button';
import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
import { PurchaseFlowPane } from '@/ui_models/app_state/purchase_flow_state';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { useState } from 'preact/hooks';

type Props = {
  appState: AppState;
  application: WebApplication;
};

const INPUT_CLASSNAME =
  'min-w-90 py-2.5 px-3 bg-default border-1 border-solid border-gray-300 rounded mb-3 placeholder-semibold text-input';

export const SignIn: FunctionComponent<Props> = observer(({ appState }) => {
  const { setCurrentPane } = appState.purchaseFlow;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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

  const handleCreateAccountInstead = () => {
    setCurrentPane(PurchaseFlowPane.CreateAccount);
  };

  const handleSignIn = () => {
    /** @TODO */
  };

  return (
    <div className="flex items-center">
      <div>
        <h1 className="mt-0 mb-2 text-2xl">Sign in</h1>
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
        </div>
        <Button
          className="min-w-30 py-3 mb-5"
          type="primary"
          label="Sign in"
          onClick={handleSignIn}
        />
        <div className="text-sm font-semibold color-neutral">
          Don’t have an account yet?{' '}
          <a
            className="color-info cursor-pointer"
            onClick={handleCreateAccountInstead}
          >
            Create account
          </a>
        </div>
      </div>
    </div>
  );
});
