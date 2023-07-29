import { MutatorClientInterface } from '../../Mutator/MutatorClientInterface'
import { TrustedContactInterface, TrustedContactMutator } from '@standardnotes/models'

export class EditContact {
  constructor(private mutator: MutatorClientInterface) {}

  async execute(
    contact: TrustedContactInterface,
    params: { name: string; publicKey: string; signingPublicKey: string },
  ): Promise<TrustedContactInterface> {
    const updatedContact = await this.mutator.changeItem<TrustedContactMutator, TrustedContactInterface>(
      contact,
      (mutator) => {
        mutator.name = params.name
        if (
          params.publicKey !== contact.publicKeySet.encryption ||
          params.signingPublicKey !== contact.publicKeySet.signing
        ) {
          mutator.addPublicKey({
            encryption: params.publicKey,
            signing: params.signingPublicKey,
          })
        }
      },
    )

    return updatedContact
  }
}
