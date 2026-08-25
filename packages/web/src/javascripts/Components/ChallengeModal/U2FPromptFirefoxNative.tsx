import { log, LoggingDomain } from '@/Logging'
import { getU2fRelyingPartyId } from '@/Constants/U2FConstants'
import { startAuthentication } from '@simplewebauthn/browser'
import type { PublicKeyCredentialRequestOptionsJSON } from '@simplewebauthn/typescript-types'
import { RefObject, useCallback, useState } from 'react'
import { c } from 'ttag'

import Button from '../Button/Button'

type Props = {
  contextData?: Record<string, unknown>
  onResponse: (response: Record<string, unknown>) => void
  apiHost: string
  buttonRef: RefObject<HTMLButtonElement>
}

const U2FPromptFirefoxNative = ({ contextData, onResponse, apiHost, buttonRef }: Props) => {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  const authenticateWithSecurityKey = useCallback(async () => {
    const username = (contextData as { username: string } | undefined)?.username
    if (!username) {
      setError(c('B1.Account.SignIn.Error').t`No username provided`)
      return
    }

    setPending(true)
    setError('')

    try {
      const response = await fetch(`${apiHost}/v1/authenticators/generate-authentication-options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      })

      const jsonResponse = await response.json()
      if (!jsonResponse.data?.options) {
        throw new Error(c('B1.Account.SignIn.Error').t`No options returned from server`)
      }

      const options = jsonResponse.data.options as PublicKeyCredentialRequestOptionsJSON

      const rpId = getU2fRelyingPartyId(apiHost, options)

      log(LoggingDomain.U2F, 'Starting native WebAuthn authentication', {
        username,
        apiHost,
        rpId,
      })

      const assertionResponse = await startAuthentication({
        ...options,
        rpId,
      })

      log(LoggingDomain.U2F, 'Native WebAuthn authentication completed', { id: assertionResponse.id })

      onResponse(assertionResponse as unknown as Record<string, unknown>)
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : String(authError))
      console.error(authError)
    } finally {
      setPending(false)
    }
  }, [contextData, apiHost, onResponse])

  return (
    <div className="min-w-76">
      {error && <div className="text-danger">{error}</div>}
      <Button primary fullWidth onClick={authenticateWithSecurityKey} disabled={pending} ref={buttonRef}>
        {pending
          ? c('B1.Account.SignIn.Status').t`Waiting for security key...`
          : c('B5.SecuritySync.Challenge.Action').t`Authenticate Device`}
      </Button>
    </div>
  )
}

export default U2FPromptFirefoxNative
