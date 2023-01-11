import { UseCaseInterface } from '@standardnotes/domain-core'

export interface UseCaseContainerInterface {
  get signInWithRecoveryCodes(): UseCaseInterface<void>
  get getRecoveryCodes(): UseCaseInterface<string>
  get addAuthenticator(): UseCaseInterface<void>
}
