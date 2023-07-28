import { useCallback, useEffect, useState } from 'react'
import Button from '../Button/Button'
import { startAuthentication } from '@simplewebauthn/browser'
import { log, LoggingDomain } from '@/Logging'

/**
 * An iframe for use in the desktop and mobile application that allows them to load app.standardnotes.com to perform
 * U2F authentication. Web applications do not need this iframe, as they can perform U2F authentication directly.
 */
const U2FAuthIframe = () => {
  const [username, setUsername] = useState('')
  const [apiHost, setApiHost] = useState<string | null>(null)
  const [source, setSource] = useState<MessageEvent['source'] | null>(null)
  const NATIVE_CLIENT_ORIGIN = 'file://'

  useEffect(() => {
    window.parent.postMessage(
      {
        mountedAuthView: true,
      },
      NATIVE_CLIENT_ORIGIN,
    )
  }, [])

  useEffect(() => {
    const messageHandler = (event: MessageEvent) => {
      log(LoggingDomain.U2F, 'U2F iframe received message', event)

      const eventDoesNotComeFromNativeClient = event.origin !== NATIVE_CLIENT_ORIGIN
      if (eventDoesNotComeFromNativeClient) {
        log(LoggingDomain.U2F, 'Not setting username; origin does not match', event.origin, NATIVE_CLIENT_ORIGIN)
        return
      }

      if (event.data.username) {
        setUsername(event.data.username)
        setApiHost(event.data.apiHost)
        setSource(event.source)
      }
    }

    window.addEventListener('message', messageHandler)

    return () => {
      window.removeEventListener('message', messageHandler)
    }
  }, [])

  const [info, setInfo] = useState('')
  const [error, setError] = useState('')

  const beginAuthentication = useCallback(async () => {
    setInfo('')
    setError('')

    try {
      if (!username || !source) {
        throw new Error('No username provided')
      }

      const response = await fetch(`${apiHost}/v1/authenticators/generate-authentication-options`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
        }),
      })

      const jsonResponse = await response.json()
      if (!jsonResponse.data || !jsonResponse.data.options) {
        throw new Error('No options returned from server')
      }

      setInfo('Waiting for security key...')

      const assertionResponse = await startAuthentication(jsonResponse.data.options)

      ;(source as WindowProxy).postMessage(
        {
          assertionResponse,
        },
        NATIVE_CLIENT_ORIGIN,
      )

      setInfo('Authentication successful!')
    } catch (error) {
      if (!error) {
        return
      }
      setError(JSON.stringify(error))
      console.error(error)
    }
  }, [source, username, apiHost])

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2">
      <div className="mb-2 text-center">
        Insert your hardware security key, then press the button below to authenticate.
      </div>
      <Button onClick={beginAuthentication}>Authenticate</Button>
      <div className="mt-2">
        <div>{info}</div>
        <div className="text-danger">{error}</div>
      </div>
    </div>
  )
}

export default U2FAuthIframe
