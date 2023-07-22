import { SyncServiceInterface } from '../../Sync/SyncServiceInterface'
import { MutatorClientInterface } from '../../Mutator/MutatorClientInterface'
import {
  FillItemContent,
  MutationType,
  PayloadEmitSource,
  TrustedContactContent,
  TrustedContactContentSpecialized,
  TrustedContactInterface,
  TrustedContactMutator,
} from '@standardnotes/models'
import { FindContact } from './FindContact'
import { ContentType, Result, UseCaseInterface } from '@standardnotes/domain-core'

export class ReplaceContactData implements UseCaseInterface<TrustedContactInterface> {
  constructor(
    private mutator: MutatorClientInterface,
    private sync: SyncServiceInterface,
    private findContact: FindContact,
  ) {}

  async execute(data: TrustedContactContentSpecialized): Promise<Result<TrustedContactInterface>> {
    const contactResult = this.findContact.execute({ userUuid: data.contactUuid })
    if (contactResult.isFailed()) {
      const newContact = await this.mutator.createItem<TrustedContactInterface>(
        ContentType.TYPES.TrustedContact,
        FillItemContent<TrustedContactContent>(data),
        true,
      )

      await this.sync.sync()

      return Result.ok(newContact)
    }

    const existingContact = contactResult.getValue()
    if (existingContact.isMe) {
      return Result.fail('Cannot replace data for me contact')
    }

    const updatedContact = await this.mutator.changeItem<TrustedContactMutator, TrustedContactInterface>(
      existingContact,
      (mutator) => {
        mutator.name = data.name
        mutator.replacePublicKeySet(data.publicKeySet)
      },
      MutationType.UpdateUserTimestamps,
      PayloadEmitSource.RemoteRetrieved,
    )

    await this.sync.sync()

    return Result.ok(updatedContact)
  }
}
