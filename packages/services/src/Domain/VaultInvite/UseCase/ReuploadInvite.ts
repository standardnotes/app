import { DecryptOwnMessage } from '../../Encryption/UseCase/Asymmetric/DecryptOwnMessage'
import { AsymmetricMessageSharedVaultInvite, TrustedContactInterface } from '@standardnotes/models'
import { SharedVaultInviteServerHash } from '@standardnotes/responses'
import { PkcKeyPair } from '@standardnotes/sncrypto-common'
import { Result, UseCaseInterface } from '@standardnotes/domain-core'
import { SendVaultInvite } from './SendVaultInvite'
import { EncryptMessage } from '../../Encryption/UseCase/Asymmetric/EncryptMessage'

export class ReuploadInvite implements UseCaseInterface<void> {
  constructor(
    private decryptOwnMessage: DecryptOwnMessage<AsymmetricMessageSharedVaultInvite>,
    private sendInvite: SendVaultInvite,
    private encryptMessage: EncryptMessage,
  ) {}

  async execute(params: {
    keys: {
      encryption: PkcKeyPair
      signing: PkcKeyPair
    }
    previousKeys?: {
      encryption: PkcKeyPair
      signing: PkcKeyPair
    }
    recipient: TrustedContactInterface
    previousInvite: SharedVaultInviteServerHash
  }): Promise<Result<SharedVaultInviteServerHash>> {
    const decryptedPreviousInvite = this.decryptOwnMessage.execute({
      message: params.previousInvite.encrypted_message,
      privateKey: params.previousKeys?.encryption.privateKey ?? params.keys.encryption.privateKey,
      recipientPublicKey: params.recipient.publicKeySet.encryption,
    })

    if (decryptedPreviousInvite.isFailed()) {
      return Result.fail(decryptedPreviousInvite.getError())
    }

    const encryptedMessage = this.encryptMessage.execute({
      message: decryptedPreviousInvite.getValue(),
      keys: params.keys,
      recipientPublicKey: params.recipient.publicKeySet.encryption,
    })

    if (encryptedMessage.isFailed()) {
      return Result.fail(encryptedMessage.getError())
    }

    const createInviteResult = await this.sendInvite.execute({
      sharedVaultUuid: params.previousInvite.shared_vault_uuid,
      recipientUuid: params.recipient.contactUuid,
      encryptedMessage: encryptedMessage.getValue(),
      permission: params.previousInvite.permission,
    })

    return createInviteResult
  }
}
