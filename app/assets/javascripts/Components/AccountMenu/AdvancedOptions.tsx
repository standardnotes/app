import { WebApplication } from '@/UIModels/Application'
import { AppState } from '@/UIModels/AppState'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import { Checkbox } from '@/Components/Checkbox'
import { DecoratedInput } from '@/Components/Input/DecoratedInput'
import { Icon } from '@/Components/Icon'

type Props = {
  application: WebApplication
  appState: AppState
  disabled?: boolean
  onVaultChange?: (isVault: boolean, vaultedEmail?: string) => void
  onStrictSignInChange?: (isStrictSignIn: boolean) => void
}

export const AdvancedOptions: FunctionComponent<Props> = observer(
  ({ appState, application, disabled = false, onVaultChange, onStrictSignInChange, children }) => {
    const { server, setServer, enableServerOption, setEnableServerOption } = appState.accountMenu
    const [showAdvanced, setShowAdvanced] = useState(false)

    const [isVault, setIsVault] = useState(false)
    const [vaultName, setVaultName] = useState('')
    const [vaultUserphrase, setVaultUserphrase] = useState('')

    const [isStrictSignin, setIsStrictSignin] = useState(false)

    useEffect(() => {
      const recomputeVaultedEmail = async () => {
        const vaultedEmail = await application.vaultToEmail(vaultName, vaultUserphrase)

        if (!vaultedEmail) {
          if (vaultName?.length > 0 && vaultUserphrase?.length > 0) {
            application.alertService.alert('Unable to compute vault name.').catch(console.error)
          }
          return
        }
        onVaultChange?.(true, vaultedEmail)
      }

      if (vaultName && vaultUserphrase) {
        recomputeVaultedEmail().catch(console.error)
      }
    }, [vaultName, vaultUserphrase, application, onVaultChange])

    useEffect(() => {
      onVaultChange?.(isVault)
    }, [isVault, onVaultChange])

    const handleIsVaultChange = () => {
      setIsVault(!isVault)
    }

    const handleVaultNameChange = (name: string) => {
      setVaultName(name)
    }

    const handleVaultUserphraseChange = (userphrase: string) => {
      setVaultUserphrase(userphrase)
    }

    const handleServerOptionChange = (e: Event) => {
      if (e.target instanceof HTMLInputElement) {
        setEnableServerOption(e.target.checked)
      }
    }

    const handleSyncServerChange = (server: string) => {
      setServer(server)
      application.setCustomHost(server).catch(console.error)
    }

    const handleStrictSigninChange = () => {
      const newValue = !isStrictSignin
      setIsStrictSignin(newValue)
      onStrictSignInChange?.(newValue)
    }

    const toggleShowAdvanced = () => {
      setShowAdvanced(!showAdvanced)
    }

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
                <DecoratedInput
                  className={'mb-2'}
                  left={[<Icon type="folder" className="color-neutral" />]}
                  type="text"
                  placeholder="Vault name"
                  value={vaultName}
                  onChange={handleVaultNameChange}
                  disabled={disabled}
                />
                <DecoratedInput
                  className={'mb-2'}
                  left={[<Icon type="server" className="color-neutral" />]}
                  type="text"
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
            <DecoratedInput
              type="text"
              left={[<Icon type="server" className="color-neutral" />]}
              placeholder="https://api.standardnotes.com"
              value={server}
              onChange={handleSyncServerChange}
              disabled={!enableServerOption && !disabled}
            />
          </div>
        ) : null}
      </>
    )
  },
)
