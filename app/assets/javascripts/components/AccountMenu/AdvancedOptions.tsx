import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { Checkbox } from '../Checkbox';
import { Icon } from '../Icon';
import { InputWithIcon } from '../InputWithIcon';

type Props = {
  application: WebApplication;
  appState: AppState;
  disabled?: boolean;
  onVaultChange?: (isVault: boolean, vaultedEmail?: string) => void;
  onStrictSignInChange?: (isStrictSignIn: boolean) => void;
};

export const AdvancedOptions: FunctionComponent<Props> = observer(
  ({
    appState,
    application,
    disabled = false,
    onVaultChange,
    onStrictSignInChange,
    children,
  }) => {
    const { server, setServer, enableServerOption, setEnableServerOption } =
      appState.accountMenu;
    const [showAdvanced, setShowAdvanced] = useState(false);

    const [isVault, setIsVault] = useState(false);
    const [vaultName, setVaultName] = useState('');
    const [vaultUserphrase, setVaultUserphrase] = useState('');

    const [isStrictSignin, setIsStrictSignin] = useState(false);

    useEffect(() => {
      const recomputeVaultedEmail = async () => {
        const vaultedEmail = await application.vaultToEmail(
          vaultName,
          vaultUserphrase
        );

        if (!vaultedEmail) {
          if (vaultName?.length > 0 && vaultUserphrase?.length > 0) {
            application.alertService.alert('Unable to compute vault name.');
          }
          return;
        }
        onVaultChange?.(true, vaultedEmail);
      };

      if (vaultName && vaultUserphrase) {
        recomputeVaultedEmail();
      }
    }, [vaultName, vaultUserphrase, application, onVaultChange]);

    useEffect(() => {
      onVaultChange?.(isVault);
    }, [isVault, onVaultChange]);

    const handleIsVaultChange = () => {
      setIsVault(!isVault);
    };

    const handleVaultNameChange = (e: Event) => {
      if (e.target instanceof HTMLInputElement) {
        setVaultName(e.target.value);
      }
    };

    const handleVaultUserphraseChange = (e: Event) => {
      if (e.target instanceof HTMLInputElement) {
        setVaultUserphrase(e.target.value);
      }
    };

    const handleServerOptionChange = (e: Event) => {
      if (e.target instanceof HTMLInputElement) {
        setEnableServerOption(e.target.checked);
      }
    };

    const handleSyncServerChange = (e: Event) => {
      if (e.target instanceof HTMLInputElement) {
        setServer(e.target.value);
        application.setCustomHost(e.target.value);
      }
    };

    const handleStrictSigninChange = () => {
      const newValue = !isStrictSignin;
      setIsStrictSignin(newValue);
      onStrictSignInChange?.(newValue);
    };

    const toggleShowAdvanced = () => {
      setShowAdvanced(!showAdvanced);
    };

    return (
      <>
        <button
          className="sn-dropdown-item focus:bg-info-backdrop focus:shadow-none font-bold"
          onClick={toggleShowAdvanced}
        >
          <div className="flex items-center">
            Advanced options
            <Icon type="chevron-down" className="color-grey-1 ml-1" />
          </div>
        </button>
        {showAdvanced ? (
          <div className="px-3 my-2">
            {children}

            {appState.enableUnfinishedFeatures && (
              <div className="flex justify-between items-center mb-1">
                <Checkbox
                  name="vault-mode"
                  label="Vault Mode"
                  checked={isVault}
                  disabled={disabled}
                  onChange={handleIsVaultChange}
                />
                <a
                  href="https://standardnotes.com/help/80"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Learn more"
                >
                  <Icon type="info" className="color-neutral" />
                </a>
              </div>
            )}

            {appState.enableUnfinishedFeatures && isVault && (
              <>
                <InputWithIcon
                  className={`mb-2`}
                  icon="folder"
                  inputType="text"
                  placeholder="Vault name"
                  value={vaultName}
                  onChange={handleVaultNameChange}
                  disabled={disabled}
                />
                <InputWithIcon
                  className={`mb-2 `}
                  icon="server"
                  inputType={'text'}
                  placeholder="Vault userphrase"
                  value={vaultUserphrase}
                  onChange={handleVaultUserphraseChange}
                  disabled={disabled}
                />
              </>
            )}

            {onStrictSignInChange && (
              <div className="flex justify-between items-center mb-1">
                <Checkbox
                  name="use-strict-signin"
                  label="Use strict sign-in"
                  checked={isStrictSignin}
                  disabled={disabled}
                  onChange={handleStrictSigninChange}
                />
                <a
                  href="https://standardnotes.com/help/security"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Learn more"
                >
                  <Icon type="info" className="color-neutral" />
                </a>
              </div>
            )}

            <Checkbox
              name="custom-sync-server"
              label="Custom sync server"
              checked={enableServerOption}
              onChange={handleServerOptionChange}
              disabled={disabled}
            />
            <InputWithIcon
              inputType="text"
              icon="server"
              placeholder="https://api.standardnotes.com"
              value={server}
              onChange={handleSyncServerChange}
              disabled={!enableServerOption && !disabled}
            />
          </div>
        ) : null}
      </>
    );
  }
);
