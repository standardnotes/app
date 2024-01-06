import { observer } from 'mobx-react-lite'
import { FunctionComponent, ReactNode, useCallback, useEffect, useState } from 'react'
import Checkbox from '@/Components/Checkbox/Checkbox'
import DecoratedInput from '@/Components/Input/DecoratedInput'
import Icon from '@/Components/Icon/Icon'
import { useApplication } from '../ApplicationProvider'
import ServerPicker from './ServerPicker/ServerPicker'
import { DefaultHost } from '@standardnotes/snjs'

type Props = {
  disabled?: boolean
  onPrivateUsernameModeChange?: (isPrivate: boolean, identifier?: string) => void
  onStrictSignInChange?: (isStrictSignIn: boolean) => void
  onRecoveryCodesChange?: (isRecoveryCodes: boolean, recoveryCodes?: string) => void
  children?: ReactNode
}

const AdvancedOptions: FunctionComponent<Props> = ({
  disabled = false,
  onPrivateUsernameModeChange,
  onStrictSignInChange,
  onRecoveryCodesChange,
  children,
}) => {
  const application = useApplication()

  const { server } = application.accountMenuController

  const [showAdvanced, setShowAdvanced] = useState(server !== DefaultHost.Api)

  const [isPrivateUsername, setIsPrivateUsername] = useState(false)
  const [privateUsername, setPrivateUsername] = useState('')

  const [isRecoveryCodes, setIsRecoveryCodes] = useState(false)
  const [recoveryCodes, setRecoveryCodes] = useState('')

  const [isStrictSignin, setIsStrictSignin] = useState(false)

  useEffect(() => {
    void application.homeServer?.isHomeServerRunning().then((isRunning) => {
      if (isRunning) {
        setShowAdvanced(true)
      }
    })
  }, [application.homeServer])

  useEffect(() => {
    const recomputePrivateUsername = async () => {
      const identifier = await application.computePrivateUsername(privateUsername)

      if (!identifier) {
        if (privateUsername?.length > 0) {
          application.alerts.alert('Unable to compute private username.').catch(console.error)
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

  const handleIsRecoveryCodesChange = useCallback(() => {
    const newValue = !isRecoveryCodes
    setIsRecoveryCodes(newValue)
    onRecoveryCodesChange?.(newValue)

    if (!isRecoveryCodes) {
      setIsPrivateUsername(false)
      setIsStrictSignin(false)
    }
  }, [isRecoveryCodes, setIsPrivateUsername, setIsStrictSignin, onRecoveryCodesChange])

  const handleRecoveryCodesChange = useCallback(
    (recoveryCodes: string) => {
      setRecoveryCodes(recoveryCodes)
      if (recoveryCodes) {
        onRecoveryCodesChange?.(true, recoveryCodes)
      }
    },
    [onRecoveryCodesChange],
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
        <>
          <div className="my-2 px-3">
            {children}

            <div className="mb-1 flex items-center justify-between">
              <Checkbox
                name="private-workspace"
                label="Private username mode"
                checked={isPrivateUsername}
                disabled={disabled || isRecoveryCodes}
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
                  disabled={disabled || isRecoveryCodes}
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
                  disabled={disabled || isRecoveryCodes}
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

            <div className="mb-1 flex items-center justify-between">
              <Checkbox
                name="recovery-codes"
                label="Use recovery code"
                checked={isRecoveryCodes}
                disabled={disabled}
                onChange={handleIsRecoveryCodesChange}
              />
            </div>

            {isRecoveryCodes && (
              <>
                <DecoratedInput
                  className={{ container: 'mb-2' }}
                  left={[<Icon type="security" className="text-neutral" />]}
                  type="text"
                  placeholder="Recovery code"
                  value={recoveryCodes}
                  onChange={handleRecoveryCodesChange}
                  disabled={disabled}
                  spellcheck={false}
                  autocomplete={false}
                />
              </>
            )}
          </div>
          <ServerPicker />
        </>
      ) : null}
    </>
  )
}

export default observer(AdvancedOptions)
