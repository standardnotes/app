import { Username } from '@standardnotes/snjs'
import { ChallengePrompt } from '@standardnotes/services'
import { RefObject, useState } from 'react'

import { WebApplication } from '@/Application/WebApplication'

import Button from '../Button/Button'
import Icon from '../Icon/Icon'

import { InputValue } from './InputValue'
import U2FPromptIframeContainer from './U2FPromptIframeContainer'
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

  if (!application.isFullU2FClient && !isAndroid()) {
    return (
      <U2FPromptIframeContainer
        contextData={contextData}
        apiHost={application.getHost.execute().getValue() || window.defaultSyncServer}
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
              setError('Failed to obtain device response')
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
              Obtained Device Response
            </span>
          ) : (
            'Authenticate Device'
          )}
        </Button>
      </div>
    )
  }
}

export default U2FPrompt
