import { ContactPublicKeySetInterface, TrustedContactInterface, TrustedContactMutator } from '@standardnotes/models'
import { MutatorClientInterface } from '../../Mutator/MutatorClientInterface'

import { Result, UseCaseInterface } from '@standardnotes/domain-core'

export class RevokePublicKeyUseCase implements UseCaseInterface<void> {
  constructor(private mutator: MutatorClientInterface) {}

  async execute(dto: {
    selfContact: TrustedContactInterface
    revokeKeySet: ContactPublicKeySetInterface
  }): Promise<Result<void>> {
    const currentKeySet = dto.selfContact.publicKeySet

    if (currentKeySet.isEqual(dto.revokeKeySet)) {
      return Result.fail('Cannot revoke current key set')
    }

    await this.mutator.changeItem<TrustedContactMutator>(dto.selfContact, (mutator) => {
      mutator.revokePublicKeySet({
        encryption: dto.revokeKeySet.encryption,
        signing: dto.revokeKeySet.signing,
      })
    })

    return Result.ok()
  }
}
