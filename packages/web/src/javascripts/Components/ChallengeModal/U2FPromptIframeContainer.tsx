import { log, LoggingDomain } from '@/Logging'
import { isDev } from '@/Utils'
import { useEffect, useRef } from 'react'

type Props = {
  contextData?: Record<string, unknown>
  onResponse: (response: string) => void
  apiHost: string
}

const U2F_IFRAME_ORIGIN = isDev ? 'http://localhost:3001/?route=u2f' : 'https://app.standardnotes.com/?route=u2f'

const U2FPromptIframeContainer = ({ contextData, onResponse, apiHost }: Props) => {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const messageHandler = (event: MessageEvent) => {
      log(LoggingDomain.U2F, 'Native client received message', event)
      const eventDoesNotComeFromU2FIFrame = event.origin !== new URL(U2F_IFRAME_ORIGIN).origin
      if (eventDoesNotComeFromU2FIFrame) {
        log(
          LoggingDomain.U2F,
          'Not sending data to U2F iframe; origin does not match',
          event.origin,
          new URL(U2F_IFRAME_ORIGIN).origin,
        )
        return
      }

      if (event.data.mountedAuthView) {
        if (iframeRef.current?.contentWindow) {
          log(LoggingDomain.U2F, 'Sending contextData to U2F iframe', contextData)
          iframeRef.current.contentWindow.postMessage(
            { username: (contextData as Record<string, unknown>).username, apiHost },
            U2F_IFRAME_ORIGIN,
          )
        }
        return
      }

      if (event.data.assertionResponse) {
        log(LoggingDomain.U2F, 'Received assertion response from U2F iframe', event.data.assertionResponse)
        onResponse(event.data.assertionResponse)
      }
    }

    window.addEventListener('message', messageHandler)

    return () => {
      window.removeEventListener('message', messageHandler)
    }
  }, [contextData, onResponse, apiHost])

  return (
    <iframe
      ref={iframeRef}
      src={U2F_IFRAME_ORIGIN}
      className="h-40 w-full"
      title="U2F"
      allow="publickey-credentials-get"
      id="u2f"
    />
  )
}

export default U2FPromptIframeContainer
