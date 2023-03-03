import { useCallback, useEffect, useState } from 'react'
import Button from '../Button/Button'
import { startAuthentication } from '@simplewebauthn/browser'

/**
 * An iframe for use in the desktop and mobile application that allows them to load app.standardnotes.com to perform
 * U2F authentication. Web applications do not need this iframe, as they can perform U2F authentication directly.
 */
const U2FAuthIframe = () => {
  const [username, setUsername] = useState('')
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
      const eventDoesNotComeFromNativeClient = event.origin !== NATIVE_CLIENT_ORIGIN
      if (eventDoesNotComeFromNativeClient) {
        return
      }

      if (event.data.username) {
        setUsername(event.data.username)
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

      const response = await fetch(`${window.defaultSyncServer}/v1/authenticators/generate-authentication-options`, {
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

      setInfo('Waiting for U2F device...')

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
      setError(error.toString())
      console.error(error.toString())
    }
  }, [source, username])

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2">
      <div className="mb-2 text-center">Insert your U2F device and press the button to authenticate.</div>
      <Button onClick={beginAuthentication}>Authenticate</Button>
      <div>{info}</div>
      <div className="text-danger">{error}</div>
    </div>
  )
}

export default U2FAuthIframe
