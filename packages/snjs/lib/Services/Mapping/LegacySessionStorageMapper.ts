import { LegacySession, MapperInterface } from '@standardnotes/domain-core'

export class LegacySessionStorageMapper implements MapperInterface<LegacySession, Record<string, unknown>> {
  toDomain(projection: Record<string, unknown>): LegacySession {
    const { jwt } = projection

    const legacySessionOrError = LegacySession.create(jwt as string)
    if (legacySessionOrError.isFailed()) {
      throw new Error(legacySessionOrError.getError())
    }

    return legacySessionOrError.getValue()
  }

  toProjection(domain: LegacySession): Record<string, unknown> {
    return {
      jwt: domain.accessToken,
    }
  }
}
