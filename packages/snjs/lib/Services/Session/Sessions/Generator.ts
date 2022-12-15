import { LegacySession, Session, SessionToken } from '@standardnotes/domain-core'

import { RawSessionPayload, RawStorageValue } from './Types'

export function SessionFromRawStorageValue(raw: RawStorageValue): LegacySession | Session | null {
  if ('jwt' in raw) {
    const legacySessionOrError = LegacySession.create(raw.jwt as string)
    if (legacySessionOrError.isFailed()) {
      return null
    }

    return legacySessionOrError.getValue()
  } else {
    const rawSession = raw as RawSessionPayload
    const accessTokenOrError = SessionToken.create(rawSession.accessToken, rawSession.accessExpiration)
    if (accessTokenOrError.isFailed()) {
      return null
    }
    const accessToken = accessTokenOrError.getValue()

    const refreshTokenOrError = SessionToken.create(rawSession.refreshToken, rawSession.refreshExpiration)
    if (refreshTokenOrError.isFailed()) {
      return null
    }
    const refreshToken = refreshTokenOrError.getValue()

    const sessionOrError = Session.create(accessToken, refreshToken, rawSession.readonlyAccess)
    if (sessionOrError.isFailed()) {
      return null
    }

    return sessionOrError.getValue()
  }
}
