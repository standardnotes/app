import { useCallback, useEffect, useState } from 'react'
import Button from '../Button/Button'
import { startAuthentication } from '@simplewebauthn/browser'
import { log, LoggingDomain } from '@/Logging'

const CHROME_CLIPPER_EXTENSION_ORIGIN = 'chrome-extension://heapafmadojoodklnkhjanbinemaagok'
const FIREFOX_CLIPPER_EXTENSION_ORIGIN = 'moz-extension://2a461925-d1b1-4ed3-99a6-91fe7633cc2c'

const ALLOWED_PARENT_ORIGINS = ['file://', CHROME_CLIPPER_EXTENSION_ORIGIN, FIREFOX_CLIPPER_EXTENSION_ORIGIN]

const isAllowedParentOrigin = (origin: string): boolean => {
  return ALLOWED_PARENT_ORIGINS.includes(origin)
}

/**
 * An iframe for use in the desktop app and web clipper extension that allows them to load app.standardnotes.com
 * to perform U2F authentication. Web applications do not need this iframe, as they can perform U2F authentication
 * directly.
 */
const U2FAuthIframe = () => {
  const [username, setUsername] = useState('')
  const [apiHost, setApiHost] = useState<string | null>(null)
  const [source, setSource] = useState<MessageEvent['source'] | null>(null)
  const [parentOrigin, setParentOrigin] = useState<string | null>(null)

  useEffect(() => {
    for (const origin of ALLOWED_PARENT_ORIGINS) {
      window.parent.postMessage(
        {
          mountedAuthView: true,
        },
        origin,
      )
    }
  }, [])

  useEffect(() => {
    const messageHandler = (event: MessageEvent) => {
      log(LoggingDomain.U2F, 'U2F iframe received message', event)

      if (!isAllowedParentOrigin(event.origin)) {
        log(LoggingDomain.U2F, 'Not setting username; origin is not allowed', event.origin)
        return
      }

      if (event.data.username) {
        setUsername(event.data.username)
        setApiHost(event.data.apiHost)
        setSource(event.source)
        setParentOrigin(event.origin)
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
      if (!username || !source || !parentOrigin) {
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
        parentOrigin,
      )

      setInfo('Authentication successful!')
    } catch (error) {
      if (!error) {
        return
      }
      setError(JSON.stringify(error))
      console.error(error)
    }
  }, [source, username, apiHost, parentOrigin])

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
