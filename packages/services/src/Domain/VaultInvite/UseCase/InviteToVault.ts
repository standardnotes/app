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
import { GetKeyPairs } from '../../Encryption/UseCase/GetKeyPairs'

export class InviteToVault implements UseCaseInterface<SharedVaultInviteServerHash> {
  constructor(
    private keyManager: KeySystemKeyManagerInterface,
    private _encryptMessage: EncryptMessage,
    private _sendInvite: SendVaultInvite,
    private _shareContact: ShareContactWithVault,
    private _getKeyPairs: GetKeyPairs,
  ) {}

  async execute(params: {
    sharedVault: SharedVaultListingInterface
    sharedVaultContacts: TrustedContactInterface[]
    recipient: TrustedContactInterface
    permission: string
  }): Promise<Result<SharedVaultInviteServerHash>> {
    const keys = this._getKeyPairs.execute()
    if (keys.isFailed()) {
      return Result.fail('Cannot invite contact; keys not found')
    }

    const createInviteResult = await this.inviteContact({
      keys: keys.getValue(),
      sharedVault: params.sharedVault,
      sharedVaultContacts: params.sharedVaultContacts,
      recipient: params.recipient,
      permission: params.permission,
    })

    if (createInviteResult.isFailed()) {
      return createInviteResult
    }

    await this.shareContactWithOtherVaultMembers({
      contact: params.recipient,
      keys: keys.getValue(),
      sharedVault: params.sharedVault,
    })

    return createInviteResult
  }

  private async shareContactWithOtherVaultMembers(params: {
    contact: TrustedContactInterface
    keys: {
      encryption: PkcKeyPair
      signing: PkcKeyPair
    }
    sharedVault: SharedVaultListingInterface
  }): Promise<Result<void>> {
    const result = await this._shareContact.execute({
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

    const encryptedMessage = this._encryptMessage.execute({
      message: {
        type: AsymmetricMessagePayloadType.SharedVaultInvite,
        data: {
          recipientUuid: params.recipient.contactUuid,
          rootKey: keySystemRootKey.content,
          trustedContacts: [meContactContent, ...delegatedContacts],
          metadata: {
            name: params.sharedVault.name,
            description: params.sharedVault.description,
            iconString: params.sharedVault.iconString,
            fileBytesUsed: params.sharedVault.sharing.fileBytesUsed,
            designatedSurvivor: params.sharedVault.sharing.designatedSurvivor,
          },
        },
      },
      keys: params.keys,
      recipientPublicKey: params.recipient.publicKeySet.encryption,
    })

    if (encryptedMessage.isFailed()) {
      return Result.fail(encryptedMessage.getError())
    }

    const createInviteResult = await this._sendInvite.execute({
      sharedVaultUuid: params.sharedVault.sharing.sharedVaultUuid,
      recipientUuid: params.recipient.contactUuid,
      encryptedMessage: encryptedMessage.getValue(),
      permission: permission.value,
    })

    return createInviteResult
  }
}
