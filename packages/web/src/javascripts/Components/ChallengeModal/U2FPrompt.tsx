import { Environment, Username } from '@standardnotes/snjs'
import { ChallengePrompt } from '@standardnotes/services'
import { RefObject, useCallback, useState } from 'react'
import { c } from 'ttag'

import { WebApplication } from '@/Application/WebApplication'
import { IS_FIREFOX } from '@/Components/SuperEditor/Lexical/Shared/environment'

import Button from '../Button/Button'
import Icon from '../Icon/Icon'

import { InputValue } from './InputValue'
import U2FPromptIframeContainer from './U2FPromptIframeContainer'
import U2FPromptFirefoxNative from './U2FPromptFirefoxNative'
import { isAndroid } from '@standardnotes/ui-services'

type Props = {
  application: WebApplication
  onValueChange: (value: InputValue['value'], prompt: ChallengePrompt) => void
  prompt: ChallengePrompt
  buttonRef: RefObject<HTMLButtonElement>
  contextData?: Record<string, unknown>
}

const U2FPrompt = ({ application, onValueChange, prompt, buttonRef, contextData }: Props) => {
  const [authenticatorResponse, setAuthenticatorResponse] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState('')

  const handleNativeResponse = useCallback(
    (response: Record<string, unknown>) => {
      onValueChange(response, prompt)
    },
    [onValueChange, prompt],
  )

  if (!application.isFullU2FClient && !isAndroid()) {
    const apiHost = application.getHost.execute().getValue() || window.defaultSyncServer

    if (application.environment === Environment.Clipper && IS_FIREFOX) {
      return (
        <U2FPromptFirefoxNative
          contextData={contextData}
          apiHost={apiHost}
          buttonRef={buttonRef}
          onResponse={handleNativeResponse}
        />
      )
    }

    return (
      <U2FPromptIframeContainer
        contextData={contextData}
        apiHost={apiHost}
        onResponse={(response) => {
          onValueChange(response, prompt)
        }}
      />
    )
  } else {
    return (
      <div className="min-w-76">
        {error && <div className="text-red-500">{error}</div>}
        <Button
          primary
          fullWidth
          colorStyle={authenticatorResponse ? 'success' : 'info'}
          onClick={async () => {
            const usernameOrError = Username.create((contextData as { username: string }).username)
            if (usernameOrError.isFailed()) {
              setError(usernameOrError.getError())
              return
            }
            const username = usernameOrError.getValue()

            let authenticatorResponse: Record<string, unknown> | null = null
            if (isAndroid()) {
              const authenticatorOptionsOrError = await application.getAuthenticatorAuthenticationOptions.execute({
                username: username.value,
              })
              if (authenticatorOptionsOrError.isFailed()) {
                setError(authenticatorOptionsOrError.getError())
                return
              }
              const authenticatorOptions = authenticatorOptionsOrError.getValue()

              authenticatorResponse = await application.mobileDevice.authenticateWithU2F(
                JSON.stringify(authenticatorOptions),
              )
            } else {
              const authenticatorResponseOrError = await application.getAuthenticatorAuthenticationResponse.execute({
                username: username.value,
              })

              if (authenticatorResponseOrError.isFailed()) {
                setError(authenticatorResponseOrError.getError())
                return
              }

              authenticatorResponse = authenticatorResponseOrError.getValue()
            }

            if (authenticatorResponse === null) {
              setError(c('B5.SecuritySync.Challenge.Error').t`Failed to obtain device response`)
              return
            }

            setAuthenticatorResponse(authenticatorResponse)
            onValueChange(authenticatorResponse, prompt)
          }}
          ref={buttonRef}
        >
          {authenticatorResponse ? (
            <span className="flex items-center justify-center gap-3">
              <Icon type="check-circle" />
              {c('B5.SecuritySync.Challenge.Info').t`Obtained Device Response`}
            </span>
          ) : (
            c('B5.SecuritySync.Challenge.Action').t`Authenticate Device`
          )}
        </Button>
      </div>
    )
  }
}

export default U2FPrompt
