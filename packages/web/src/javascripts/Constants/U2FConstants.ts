/** Relying party ID used when registering and authenticating hardware keys for Standard Notes. */
export const U2F_RELYING_PARTY_ID = 'app.standardnotes.com'

/**
 * Stable WebAuthn origin for the Firefox clipper extension (SHA-256 of gecko.id, a–p encoded).
 * Must be included in the auth server's U2F_EXPECTED_ORIGIN allowlist.
 * @see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Use_the_web_authn_api
 */
export const FIREFOX_CLIPPER_WEBAUTHN_ORIGIN =
  'moz-extension://mbmeiccjaghdhkomcnlbapkpmhjgcjdonnphcmpgbgnlpbepegcaeomhoinfmflc'

export function isLocalU2fApiHost(apiHost: string): boolean {
  try {
    const hostname = new URL(apiHost).hostname
    return hostname === 'localhost' || hostname === '127.0.0.1'
  } catch {
    return false
  }
}

/** Prod clipper always uses app.standardnotes.com; local servers use their configured rpId. */
export function getU2fRelyingPartyId(apiHost: string, serverOptions?: { rpId?: string }): string {
  if (isLocalU2fApiHost(apiHost)) {
    return serverOptions?.rpId ?? new URL(apiHost).hostname
  }

  return U2F_RELYING_PARTY_ID
}
