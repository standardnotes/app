import { Username } from '@standardnotes/snjs'
import { ChallengePrompt, WebAppEvent } from '@standardnotes/services'
import { RefObject, useEffect, useState } from 'react'

import { WebApplication } from '@/Application/Application'
import { isAndroid } from '@/Utils'

import Button from '../Button/Button'
import Icon from '../Icon/Icon'

import { InputValue } from './InputValue'
import U2FPromptIframeContainer from './U2FPromptIframeContainer'

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

  useEffect(() => {
    const disposer = application.addWebEventObserver((event, authenticatorResponse) => {
      if (event === WebAppEvent.U2FAuthenticatorResponseObtained) {
        onValueChange(authenticatorResponse as string, prompt)
      }
    })

    return disposer
  }, [application, onValueChange, prompt])

  useEffect(() => {
    async function promptForU2F() {
      const usernameOrError = Username.create((contextData as { username: string }).username)
      if (usernameOrError.isFailed()) {
        setError(usernameOrError.getError())
        return
      }
      const username = usernameOrError.getValue()

      const authenticatorOptionsOrError = await application.getAuthenticatorAuthenticationOptions.execute({
        username: username.value,
      })
      if (authenticatorOptionsOrError.isFailed()) {
        setError(authenticatorOptionsOrError.getError())
        return
      }
      const authenticatorOptions = authenticatorOptionsOrError.getValue()

      await application.mobileDevice().promptForU2FAuthentication(JSON.stringify(authenticatorOptions))
    }

    void promptForU2F()
  }, [application, contextData, setError])

  const isOnAndroidDevice = isAndroid()

  if (!application.isFullU2FClient && !isOnAndroidDevice) {
    return (
      <U2FPromptIframeContainer
        contextData={contextData}
        apiHost={application.getHost() || window.defaultSyncServer}
        onResponse={(response) => {
          onValueChange(response, prompt)
        }}
      />
    )
  }

  return (
    <div className="min-w-76">
      {error && <div className="text-red-500">{error}</div>}
      {!isOnAndroidDevice && (
        <Button
          primary
          fullWidth
          colorStyle={authenticatorResponse ? 'success' : 'info'}
          onClick={async () => {
            if (!contextData || contextData.username === undefined) {
              setError('No username provided')
              return
            }

            const authenticatorResponseOrError = await application.getAuthenticatorAuthenticationResponse.execute({
              username: contextData.username as string,
            })

            if (authenticatorResponseOrError.isFailed()) {
              setError(authenticatorResponseOrError.getError())
              return
            }

            const authenticatorResponse = authenticatorResponseOrError.getValue()

            setAuthenticatorResponse(authenticatorResponse)
            onValueChange(authenticatorResponse, prompt)
          }}
          ref={buttonRef}
        >
          {authenticatorResponse ? (
            <span className="flex items-center justify-center gap-3">
              <Icon type="check-circle" />
              Obtained Device Response
            </span>
          ) : (
            'Authenticate Device'
          )}
        </Button>
      )}
    </div>
  )
}

export default U2FPrompt
