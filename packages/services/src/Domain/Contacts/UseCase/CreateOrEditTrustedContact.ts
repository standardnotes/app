import { SyncServiceInterface } from './../../Sync/SyncServiceInterface'
import { MutatorClientInterface } from './../../Mutator/MutatorClientInterface'
import { ItemManagerInterface } from './../../Item/ItemManagerInterface'
import {
  ContactPublicKeySet,
  FillItemContent,
  TrustedContactContent,
  TrustedContactContentSpecialized,
  TrustedContactInterface,
} from '@standardnotes/models'
import { FindTrustedContactUseCase } from './FindTrustedContact'
import { UnknownContactName } from '../UnknownContactName'
import { UpdateTrustedContactUseCase } from './UpdateTrustedContact'
import { ContentType } from '@standardnotes/domain-core'

export class CreateOrEditTrustedContactUseCase {
  constructor(
    private items: ItemManagerInterface,
    private mutator: MutatorClientInterface,
    private sync: SyncServiceInterface,
  ) {}

  async execute(params: {
    name?: string
    contactUuid: string
    publicKey: string
    signingPublicKey: string
    isMe?: boolean
  }): Promise<TrustedContactInterface | undefined> {
    const findUsecase = new FindTrustedContactUseCase(this.items)
    const existingContact = findUsecase.execute({ userUuid: params.contactUuid })

    if (existingContact) {
      const updateUsecase = new UpdateTrustedContactUseCase(this.mutator, this.sync)
      await updateUsecase.execute(existingContact, { ...params, name: params.name ?? existingContact.name })
      return existingContact
    }

    const content: TrustedContactContentSpecialized = {
      name: params.name ?? UnknownContactName,
      publicKeySet: ContactPublicKeySet.FromJson({
        encryption: params.publicKey,
        signing: params.signingPublicKey,
        isRevoked: false,
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

    await this.sync.sync()

    return contact
  }
}
