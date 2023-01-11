import { UseCaseInterface } from '@standardnotes/domain-core'

export interface UseCaseContainerInterface {
  get signInWithRecoveryCodes(): UseCaseInterface<void>
  get getRecoveryCodes(): UseCaseInterface<string>
  get addAuthenticator(): UseCaseInterface<void>
  get listAuthenticators(): UseCaseInterface<Array<{ id: string; name: string }>>
  get deleteAuthenticator(): UseCaseInterface<void>
  get verifyAuthenticator(): UseCaseInterface<void>
}
