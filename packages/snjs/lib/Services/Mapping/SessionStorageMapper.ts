import { MapperInterface, Session, SessionToken } from '@standardnotes/domain-core'

export class SessionStorageMapper implements MapperInterface<Session, Record<string, unknown>> {
  toDomain(projection: Record<string, unknown>): Session {
    const accessTokenOrError = SessionToken.create(
      projection.accessToken as string,
      projection.accessExpiration as number,
    )
    if (accessTokenOrError.isFailed()) {
      throw new Error(accessTokenOrError.getError())
    }
    const accessToken = accessTokenOrError.getValue()

    const refreshTokenOrError = SessionToken.create(
      projection.refreshToken as string,
      projection.refreshExpiration as number,
    )
    if (refreshTokenOrError.isFailed()) {
      throw new Error(refreshTokenOrError.getError())
    }
    const refreshToken = refreshTokenOrError.getValue()

    const session = Session.create(accessToken, refreshToken, projection.readonlyAccess as boolean)
    if (session.isFailed()) {
      throw new Error(session.getError())
    }

    return session.getValue()
  }

  toProjection(domain: Session): Record<string, unknown> {
    return {
      accessToken: domain.accessToken.value,
      refreshToken: domain.refreshToken.value,
      accessExpiration: domain.accessToken.expiresAt,
      refreshExpiration: domain.refreshToken.expiresAt,
      readonlyAccess: domain.isReadOnly(),
    }
  }
}
