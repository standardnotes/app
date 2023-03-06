import { WebApplication } from '@/Application/Application'
import { ChallengePrompt } from '@standardnotes/services'
import { RefObject, useState } from 'react'
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

  if (!application.isFullU2FClient) {
    return (
      <U2FPromptIframeContainer
        contextData={contextData}
        onResponse={(response) => {
          onValueChange(response, prompt)
        }}
      />
    )
  }

  return (
    <div className="min-w-76">
      {error && <div className="text-red-500">{error}</div>}
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
    </div>
  )
}

export default U2FPrompt
