import { WebApplication } from '@/UIModels/Application'
import { AppState } from '@/UIModels/AppState'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'preact'
import { useCallback, useEffect, useState } from 'preact/hooks'
import { Checkbox } from '@/Components/Checkbox/Checkbox'
import { DecoratedInput } from '@/Components/Input/DecoratedInput'
import { Icon } from '@/Components/Icon/Icon'

type Props = {
  application: WebApplication
  appState: AppState
  disabled?: boolean
  onPrivateWorkspaceChange?: (isPrivate: boolean, identifier?: string) => void
  onStrictSignInChange?: (isStrictSignIn: boolean) => void
}

export const AdvancedOptions: FunctionComponent<Props> = observer(
  ({ appState, application, disabled = false, onPrivateWorkspaceChange, onStrictSignInChange, children }) => {
    const { server, setServer, enableServerOption, setEnableServerOption } = appState.accountMenu
    const [showAdvanced, setShowAdvanced] = useState(false)

    const [isPrivateWorkspace, setIsPrivateWorkspace] = useState(false)
    const [privateWorkspaceName, setPrivateWorkspaceName] = useState('')
    const [privateWorkspaceUserphrase, setPrivateWorkspaceUserphrase] = useState('')

    const [isStrictSignin, setIsStrictSignin] = useState(false)

    useEffect(() => {
      const recomputePrivateWorkspaceIdentifier = async () => {
        const identifier = await application.computePrivateWorkspaceIdentifier(
          privateWorkspaceName,
          privateWorkspaceUserphrase,
        )

        if (!identifier) {
          if (privateWorkspaceName?.length > 0 && privateWorkspaceUserphrase?.length > 0) {
            application.alertService.alert('Unable to compute private workspace name.').catch(console.error)
          }
          return
        }
        onPrivateWorkspaceChange?.(true, identifier)
      }

      if (privateWorkspaceName && privateWorkspaceUserphrase) {
        recomputePrivateWorkspaceIdentifier().catch(console.error)
      }
    }, [privateWorkspaceName, privateWorkspaceUserphrase, application, onPrivateWorkspaceChange])

    useEffect(() => {
      onPrivateWorkspaceChange?.(isPrivateWorkspace)
    }, [isPrivateWorkspace, onPrivateWorkspaceChange])

    const handleIsPrivateWorkspaceChange = useCallback(() => {
      setIsPrivateWorkspace(!isPrivateWorkspace)
    }, [isPrivateWorkspace])

    const handlePrivateWorkspaceNameChange = useCallback((name: string) => {
      setPrivateWorkspaceName(name)
    }, [])

    const handlePrivateWorkspaceUserphraseChange = useCallback((userphrase: string) => {
      setPrivateWorkspaceUserphrase(userphrase)
    }, [])

    const handleServerOptionChange = useCallback(
      (e: Event) => {
        if (e.target instanceof HTMLInputElement) {
          setEnableServerOption(e.target.checked)
        }
      },
      [setEnableServerOption],
    )

    const handleSyncServerChange = useCallback(
      (server: string) => {
        setServer(server)
        application.setCustomHost(server).catch(console.error)
      },
      [application, setServer],
    )

    const handleStrictSigninChange = useCallback(() => {
      const newValue = !isStrictSignin
      setIsStrictSignin(newValue)
      onStrictSignInChange?.(newValue)
    }, [isStrictSignin, onStrictSignInChange])

    const toggleShowAdvanced = useCallback(() => {
      setShowAdvanced(!showAdvanced)
    }, [showAdvanced])

    return (
      <>
        <button
          className="sn-dropdown-item focus:bg-info-backdrop focus:shadow-none font-bold"
          onClick={toggleShowAdvanced}
        >
          <div className="flex items-center">
            Advanced options
            <Icon type="chevron-down" className="color-passive-1 ml-1" />
          </div>
        </button>
        {showAdvanced ? (
          <div className="px-3 my-2">
            {children}

            <div className="flex justify-between items-center mb-1">
              <Checkbox
                name="private-workspace"
                label="Private workspace"
                checked={isPrivateWorkspace}
                disabled={disabled}
                onChange={handleIsPrivateWorkspaceChange}
              />
              <a href="https://standardnotes.com/help/80" target="_blank" rel="noopener noreferrer" title="Learn more">
                <Icon type="info" className="color-neutral" />
              </a>
            </div>

            {isPrivateWorkspace && (
              <>
                <DecoratedInput
                  className={'mb-2'}
                  left={[<Icon type="server" className="color-neutral" />]}
                  type="text"
                  placeholder="Userphrase"
                  value={privateWorkspaceUserphrase}
                  onChange={handlePrivateWorkspaceUserphraseChange}
                  disabled={disabled}
                />
                <DecoratedInput
                  className={'mb-2'}
                  left={[<Icon type="folder" className="color-neutral" />]}
                  type="text"
                  placeholder="Name"
                  value={privateWorkspaceName}
                  onChange={handlePrivateWorkspaceNameChange}
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
