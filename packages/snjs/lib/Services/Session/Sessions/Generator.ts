import { JwtSession } from './JwtSession'
import { TokenSession } from './TokenSession'
import { RawSessionPayload, RawStorageValue } from './Types'

export function SessionFromRawStorageValue(raw: RawStorageValue): JwtSession | TokenSession {
  if ('jwt' in raw) {
    return new JwtSession(raw.jwt as string)
  } else {
    const rawSession = raw as RawSessionPayload
    return new TokenSession(
      rawSession.accessToken,
      rawSession.accessExpiration,
      rawSession.refreshToken,
      rawSession.refreshExpiration,
      rawSession.readonlyAccess,
    )
  }
}
