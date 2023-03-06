import { WebApplication } from '@/Application/Application'
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
  const U2F_IFRAME_ORIGIN = 'https://app.standardnotes.com/?route=u2f'

  if (!application.isFullU2FClient) {
    window.onmessage = (event) => {
      const eventDoesNotComeFromU2FIFrame = event.origin !== U2F_IFRAME_ORIGIN
      if (eventDoesNotComeFromU2FIFrame) {
        return
      }

      if (event.data.mountedAuthView) {
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage(
            { username: (contextData as Record<string, unknown>).username },
            U2F_IFRAME_ORIGIN,
          )
        }
        return
      }
      if (event.data.assertionResponse) {
        setAuthenticatorResponse(event.data.assertionResponse)
        onValueChange(event.data.assertionResponse, prompt)
      }
    }

    return (
      <iframe
        ref={iframeRef}
        src={U2F_IFRAME_ORIGIN}
        className="h-50 w-full"
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
