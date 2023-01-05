import { UseCaseInterface } from '@standardnotes/domain-core'

export interface UseCaseContainerInterface {
  get signInWithRecoveryCodes(): UseCaseInterface<void>
}
