import { isDev } from '@/Utils'

/** Align rpId with the page hostname for local WebAuthn development. */
export function prepareWebAuthnRegistrationOptions(options: Record<string, unknown>): Record<string, unknown> {
  if (!isDev) {
    return options
  }

  const hostname = window.location.hostname
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return options
  }

  const rp = options.rp as { id?: string; name?: string } | undefined
  if (!rp) {
    return options
  }

  return {
    ...options,
    rp: {
      ...rp,
      id: hostname,
    },
  }
}
