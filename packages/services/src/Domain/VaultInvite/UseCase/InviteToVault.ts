import { SharedVaultInviteServerHash } from '@standardnotes/responses'
import {
  TrustedContactInterface,
  SharedVaultListingInterface,
  AsymmetricMessagePayloadType,
  VaultInviteDelegatedContact,
} from '@standardnotes/models'
import { SendVaultInvite } from './SendVaultInvite'
import { PkcKeyPair } from '@standardnotes/sncrypto-common'
import { EncryptMessage } from '../../Encryption/UseCase/Asymmetric/EncryptMessage'
import { Result, SharedVaultUserPermission, UseCaseInterface } from '@standardnotes/domain-core'
import { ShareContactWithVault } from '../../SharedVaults/UseCase/ShareContactWithVault'
import { KeySystemKeyManagerInterface } from '../../KeySystem/KeySystemKeyManagerInterface'

export class InviteToVault implements UseCaseInterface<SharedVaultInviteServerHash> {
  constructor(
    private keyManager: KeySystemKeyManagerInterface,
    private encryptMessage: EncryptMessage,
    private sendInvite: SendVaultInvite,
    private shareContact: ShareContactWithVault,
  ) {}

  async execute(params: {
    keys: {
      encryption: PkcKeyPair
      signing: PkcKeyPair
    }
    senderUuid: string
    sharedVault: SharedVaultListingInterface
    sharedVaultContacts: TrustedContactInterface[]
    recipient: TrustedContactInterface
    permission: string
  }): Promise<Result<SharedVaultInviteServerHash>> {
    const createInviteResult = await this.inviteContact(params)

    if (createInviteResult.isFailed()) {
      return createInviteResult
    }

    await this.shareContactWithOtherVaultMembers({
      contact: params.recipient,
      senderUuid: params.senderUuid,
      keys: params.keys,
      sharedVault: params.sharedVault,
    })

    return createInviteResult
  }

  private async shareContactWithOtherVaultMembers(params: {
    contact: TrustedContactInterface
    senderUuid: string
    keys: {
      encryption: PkcKeyPair
      signing: PkcKeyPair
    }
    sharedVault: SharedVaultListingInterface
  }): Promise<Result<void>> {
    const result = await this.shareContact.execute({
      keys: params.keys,
      senderUserUuid: params.senderUuid,
      sharedVault: params.sharedVault,
      contactToShare: params.contact,
    })

    return result
  }

  private async inviteContact(params: {
    keys: {
      encryption: PkcKeyPair
      signing: PkcKeyPair
    }
    sharedVault: SharedVaultListingInterface
    sharedVaultContacts: TrustedContactInterface[]
    recipient: TrustedContactInterface
    permission: string
  }): Promise<Result<SharedVaultInviteServerHash>> {
    const permissionOrError = SharedVaultUserPermission.create(params.permission)
    if (permissionOrError.isFailed()) {
      return Result.fail(permissionOrError.getError())
    }
    const permission = permissionOrError.getValue()

    const keySystemRootKey = this.keyManager.getPrimaryKeySystemRootKey(params.sharedVault.systemIdentifier)
    if (!keySystemRootKey) {
      return Result.fail('Cannot invite contact; key system root key not found')
    }

    const meContact = params.sharedVaultContacts.find((contact) => contact.isMe)
    if (!meContact) {
      return Result.fail('Cannot invite contact; me contact not found')
    }

    const meContactContent: VaultInviteDelegatedContact = {
      name: undefined,
      contactUuid: meContact.contactUuid,
      publicKeySet: meContact.publicKeySet,
    }

    const delegatedContacts: VaultInviteDelegatedContact[] = params.sharedVaultContacts
      .filter((contact) => !contact.isMe && contact.contactUuid !== params.recipient.contactUuid)
      .map((contact) => {
        return {
          name: contact.name,
          contactUuid: contact.contactUuid,
          publicKeySet: contact.publicKeySet,
        }
      })

    const encryptedMessage = this.encryptMessage.execute({
      message: {
        type: AsymmetricMessagePayloadType.SharedVaultInvite,
        data: {
          recipientUuid: params.recipient.contactUuid,
          rootKey: keySystemRootKey.content,
          trustedContacts: [meContactContent, ...delegatedContacts],
          metadata: {
            name: params.sharedVault.name,
            description: params.sharedVault.description,
          },
        },
      },
      keys: params.keys,
      recipientPublicKey: params.recipient.publicKeySet.encryption,
    })

    if (encryptedMessage.isFailed()) {
      return Result.fail(encryptedMessage.getError())
    }

    const createInviteResult = await this.sendInvite.execute({
      sharedVaultUuid: params.sharedVault.sharing.sharedVaultUuid,
      recipientUuid: params.recipient.contactUuid,
      encryptedMessage: encryptedMessage.getValue(),
      permission: permission.value,
    })

    return createInviteResult
  }
}
