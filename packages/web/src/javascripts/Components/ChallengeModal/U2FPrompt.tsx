import { WebApplication } from '@/Application/Application'
import { isDesktopApplication } from '@/Utils'
import { ChallengePrompt } from '@standardnotes/services'
import { RefObject, useRef, useState } from 'react'
import Button from '../Button/Button'
import Icon from '../Icon/Icon'
import { InputValue } from './InputValue'

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
  const iframeRef = useRef<HTMLIFrameElement>(null)

  if (isDesktopApplication()) {
    window.onmessage = (event) => {
      if (event.data.assertionResponse) {
        setAuthenticatorResponse(event.data.assertionResponse)
        onValueChange(event.data.assertionResponse, prompt)
      }
    }
    if (iframeRef.current) {
      iframeRef.current.onload = () => {
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage(
            { username: (contextData as Record<string, unknown>).username },
            '*',
          )
        }
      }
    }

    return (
      <iframe
        ref={iframeRef}
        src="https://app.standardnotes.com/u2f"
        className="h-96 w-full"
        title="U2F"
        allow="publickey-credentials-get"
        id="u2f"
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
            username: contextData.username,
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
