import { WebApplication } from '@/Application/WebApplication'
import { useState } from 'react'

import Button from '../Button/Button'
import Icon from '../Icon/Icon'
import StyledTooltip from '../StyledTooltip/StyledTooltip'

const RecoveryCodeBanner = ({ application }: { application: WebApplication }) => {
  const [recoveryCode, setRecoveryCode] = useState<string>()
  const [errorMessage, setErrorMessage] = useState<string>()

  const onClickShow = async () => {
    const authorized = await application.challenges.promptForAccountPassword()

    if (!authorized) {
      return
    }

    const recoveryCodeOrError = await application.getRecoveryCodes.execute()
    if (recoveryCodeOrError.isFailed()) {
      setErrorMessage(recoveryCodeOrError.getError())
      return
    }

    setRecoveryCode(recoveryCodeOrError.getValue())
  }

  return (
    <div className="grid grid-cols-1 rounded-md border border-border p-4">
      <div className="flex items-center">
        <Icon className="-ml-1 mr-1 h-5 w-5 text-info group-disabled:text-passive-2" type="asterisk" />
        <h1 className="sk-h3 m-0 text-sm font-semibold">Save your recovery code</h1>
      </div>
      <p className="col-start-1 col-end-3 m-0 mt-1 text-sm">
        Your recovery code allows you access to your account in the event you lose your 2FA authenticating device or
        app. Save your recovery code in a safe place outside your account.
      </p>
      {errorMessage && <div>{errorMessage}</div>}
      {!recoveryCode && (
        <Button primary small className="col-start-1 col-end-3 mt-3 justify-self-start uppercase" onClick={onClickShow}>
          Show Recovery Code
        </Button>
      )}
      {recoveryCode && (
        <div className="group relative mt-2 rounded border border-border px-3 py-2 text-sm font-semibold">
          <StyledTooltip label="Copy to clipboard" className="!z-modal">
            <button
              className="absolute right-2 top-2 flex rounded border border-border bg-default p-1 opacity-0 hover:bg-contrast focus:opacity-100 group-hover:opacity-100"
              onClick={() => {
                void navigator.clipboard.writeText(recoveryCode)
              }}
            >
              <Icon type="copy" size="small" />
            </button>
          </StyledTooltip>
          {recoveryCode}
        </div>
      )}
    </div>
  )
}

export default RecoveryCodeBanner
