import { MutatorClientInterface } from '../../Mutator/MutatorClientInterface'
import {
  ContactPublicKeySet,
  FillItemContent,
  TrustedContactContent,
  TrustedContactContentSpecialized,
  TrustedContactInterface,
} from '@standardnotes/models'
import { FindContact } from './FindContact'
import { UnknownContactName } from '../UnknownContactName'
import { EditContact } from './EditContact'
import { ContentType } from '@standardnotes/domain-core'

export class CreateOrEditContact {
  constructor(
    private mutator: MutatorClientInterface,
    private findContact: FindContact,
    private editContact: EditContact,
  ) {}

  async execute(params: {
    name?: string
    contactUuid: string
    publicKey: string
    signingPublicKey: string
    isMe?: boolean
  }): Promise<TrustedContactInterface | undefined> {
    const existingContact = this.findContact.execute({ userUuid: params.contactUuid })

    if (!existingContact.isFailed()) {
      await this.editContact.execute(existingContact.getValue(), {
        ...params,
        name: params.name ?? existingContact.getValue().name,
      })
      return existingContact.getValue()
    }

    const content: TrustedContactContentSpecialized = {
      name: params.name ?? UnknownContactName,
      publicKeySet: ContactPublicKeySet.FromJson({
        encryption: params.publicKey,
        signing: params.signingPublicKey,
        timestamp: new Date(),
      }),
      contactUuid: params.contactUuid,
      isMe: params.isMe ?? false,
    }

    const contact = await this.mutator.createItem<TrustedContactInterface>(
      ContentType.TYPES.TrustedContact,
      FillItemContent<TrustedContactContent>(content),
      true,
    )

    return contact
  }
}
