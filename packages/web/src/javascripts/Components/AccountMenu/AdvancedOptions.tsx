import { WebApplication } from '@/Application/Application'
import { ViewControllerManager } from '@/Controllers/ViewControllerManager'
import { observer } from 'mobx-react-lite'
import { ChangeEventHandler, FunctionComponent, ReactNode, useCallback, useEffect, useState } from 'react'
import Checkbox from '@/Components/Checkbox/Checkbox'
import DecoratedInput from '@/Components/Input/DecoratedInput'
import Icon from '@/Components/Icon/Icon'

type Props = {
  application: WebApplication
  viewControllerManager: ViewControllerManager
  disabled?: boolean
  onPrivateUsernameModeChange?: (isPrivate: boolean, identifier?: string) => void
  onStrictSignInChange?: (isStrictSignIn: boolean) => void
  children?: ReactNode
}

const AdvancedOptions: FunctionComponent<Props> = ({
  viewControllerManager,
  application,
  disabled = false,
  onPrivateUsernameModeChange,
  onStrictSignInChange,
  children,
}) => {
  const { server, setServer, enableServerOption, setEnableServerOption } = viewControllerManager.accountMenuController
  const [showAdvanced, setShowAdvanced] = useState(false)

  const [isPrivateUsername, setIsPrivateUsername] = useState(false)
  const [privateUsername, setPrivateUsername] = useState('')

  const [isStrictSignin, setIsStrictSignin] = useState(false)

  useEffect(() => {
    const recomputePrivateUsername = async () => {
      const identifier = await application.computePrivateUsername(privateUsername)

      if (!identifier) {
        if (privateUsername?.length > 0) {
          application.alertService.alert('Unable to compute private username.').catch(console.error)
        }
        return
      }
      onPrivateUsernameModeChange?.(true, identifier)
    }

    if (privateUsername) {
      recomputePrivateUsername().catch(console.error)
    }
  }, [privateUsername, application, onPrivateUsernameModeChange])

  useEffect(() => {
    onPrivateUsernameModeChange?.(isPrivateUsername)
  }, [isPrivateUsername, onPrivateUsernameModeChange])

  const handleIsPrivateUsernameChange = useCallback(() => {
    setIsPrivateUsername(!isPrivateUsername)
  }, [isPrivateUsername])

  const handlePrivateUsernameNameChange = useCallback((name: string) => {
    setPrivateUsername(name)
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
              label="Private username mode"
              checked={isPrivateUsername}
              disabled={disabled}
              onChange={handleIsPrivateUsernameChange}
            />
            <a href="https://standardnotes.com/help/80" target="_blank" rel="noopener noreferrer" title="Learn more">
              <Icon type="info" className="text-neutral" />
            </a>
          </div>

          {isPrivateUsername && (
            <>
              <DecoratedInput
                className={{ container: 'mb-2' }}
                left={[<Icon type="account-circle" className="text-neutral" />]}
                type="text"
                placeholder="Username"
                value={privateUsername}
                onChange={handlePrivateUsernameNameChange}
                disabled={disabled}
                spellcheck={false}
                autocomplete={false}
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
