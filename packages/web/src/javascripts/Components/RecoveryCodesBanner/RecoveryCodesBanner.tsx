import { WebApplication } from '@/Application/Application'
import { useState } from 'react'

import Button from '../Button/Button'
import Icon from '../Icon/Icon'

const RecoveryCodesBanner = ({ application }: { application: WebApplication }) => {
  const [recoveryCodes, setRecoveryCodes] = useState<string>()
  const [errorMessage, setErrorMessage] = useState<string>()

  const onClick = async () => {
    const recoveryCodesOrError = await application.getRecoveryCodes.execute()
    if (recoveryCodesOrError.isFailed()) {
      setErrorMessage(recoveryCodesOrError.getError())
      return
    }

    setRecoveryCodes(recoveryCodesOrError.getValue())
  }

  return (
    <div className="grid grid-cols-1 rounded-md border border-border p-4">
      <div className="flex items-center">
        <Icon className="mr-1 -ml-1 h-5 w-5 text-info group-disabled:text-passive-2" type="asterisk" />
        <h1 className="sk-h3 m-0 text-sm font-semibold">Save your recovery codes</h1>
      </div>
      <p className="col-start-1 col-end-3 m-0 mt-1 text-sm">
        Please save and keep your recovery codes in a safe place other than this account. They are the last resort in
        case you lose your device and are locked out of your account.
      </p>
      {errorMessage && <div>{errorMessage}</div>}
      {!recoveryCodes && (
        <Button primary small className="col-start-1 col-end-3 mt-3 justify-self-start uppercase" onClick={onClick}>
          Show Recovery Codes
        </Button>
      )}
      {recoveryCodes && (
        <p>
          <strong>{recoveryCodes}</strong>
        </p>
      )}
    </div>
  )
}

export default RecoveryCodesBanner
