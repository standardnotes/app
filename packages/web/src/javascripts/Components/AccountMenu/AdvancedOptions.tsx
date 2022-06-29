import { WebApplication } from '@/Application/Application'
import { ViewControllerManager } from '@/Services/ViewControllerManager'
import { observer } from 'mobx-react-lite'
import { ChangeEventHandler, FunctionComponent, useCallback, useEffect, useState } from 'react'
import Checkbox from '@/Components/Checkbox/Checkbox'
import DecoratedInput from '@/Components/Input/DecoratedInput'
import Icon from '@/Components/Icon/Icon'

type Props = {
  application: WebApplication
  viewControllerManager: ViewControllerManager
  disabled?: boolean
  onPrivateWorkspaceChange?: (isPrivate: boolean, identifier?: string) => void
  onStrictSignInChange?: (isStrictSignIn: boolean) => void
}

const AdvancedOptions: FunctionComponent<Props> = ({
  viewControllerManager,
  application,
  disabled = false,
  onPrivateWorkspaceChange,
  onStrictSignInChange,
  children,
}) => {
  const { server, setServer, enableServerOption, setEnableServerOption } = viewControllerManager.accountMenuController
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

  const handleServerOptionChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
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
        className="flex w-full cursor-pointer items-center border-0 bg-transparent px-3 py-1.5 text-left text-sm font-bold text-text hover:bg-contrast hover:text-foreground focus:bg-info-backdrop focus:shadow-none"
        onClick={toggleShowAdvanced}
      >
        <div className="flex items-center">
          Advanced options
          <Icon type="chevron-down" className="ml-1 text-passive-1" />
        </div>
      </button>
      {showAdvanced ? (
        <div className="my-2 px-3">
          {children}

          <div className="mb-1 flex items-center justify-between">
            <Checkbox
              name="private-workspace"
              label="Private workspace"
              checked={isPrivateWorkspace}
              disabled={disabled}
              onChange={handleIsPrivateWorkspaceChange}
            />
            <a href="https://standardnotes.com/help/80" target="_blank" rel="noopener noreferrer" title="Learn more">
              <Icon type="info" className="text-neutral" />
            </a>
          </div>

          {isPrivateWorkspace && (
            <>
              <DecoratedInput
                className={{ container: 'mb-2' }}
                left={[<Icon type="server" className="text-neutral" />]}
                type="text"
                placeholder="Userphrase"
                value={privateWorkspaceUserphrase}
                onChange={handlePrivateWorkspaceUserphraseChange}
                disabled={disabled}
              />
              <DecoratedInput
                className={{ container: 'mb-2' }}
                left={[<Icon type="folder" className="text-neutral" />]}
                type="text"
                placeholder="Name"
                value={privateWorkspaceName}
                onChange={handlePrivateWorkspaceNameChange}
                disabled={disabled}
              />
            </>
          )}

          {onStrictSignInChange && (
            <div className="mb-1 flex items-center justify-between">
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
                <Icon type="info" className="text-neutral" />
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
            left={[<Icon type="server" className="text-neutral" />]}
            placeholder="https://api.standardnotes.com"
            value={server}
            onChange={handleSyncServerChange}
            disabled={!enableServerOption && !disabled}
          />
        </div>
      ) : null}
    </>
  )
}

export default observer(AdvancedOptions)
