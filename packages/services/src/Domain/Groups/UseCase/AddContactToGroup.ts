import { EncryptionProviderInterface } from '@standardnotes/encryption'
import {
  ClientDisplayableError,
  GroupInviteServerHash,
  GroupInviteType,
  GroupPermission,
  GroupServerHash,
} from '@standardnotes/responses'
import { TrustedContactInterface } from '@standardnotes/models'
import { GroupInvitesServerInterface } from '@standardnotes/api'
import { CreateGroupInviteUseCase } from './CreateGroupInvite'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'

export class AddContactToGroupUseCase {
  constructor(
    private encryption: EncryptionProviderInterface,
    private vaultInvitesServer: GroupInvitesServerInterface,
    private items: ItemManagerInterface,
  ) {}

  async execute(params: {
    inviterPrivateKey: string
    inviterPublicKey: string
    group: GroupServerHash
    contact: TrustedContactInterface
    permissions: GroupPermission
  }): Promise<GroupInviteServerHash | ClientDisplayableError> {
    const vaultKey = this.items.getPrimarySyncedVaultKeyCopy(params.group.vault_system_identifier)
    if (!vaultKey) {
      return ClientDisplayableError.FromString('Cannot add contact; vault key not found')
    }

    const encryptedVaultKeyContent = this.encryption.encryptVaultKeyContentWithRecipientPublicKey(
      vaultKey.content,
      params.inviterPrivateKey,
      params.contact.publicKey,
    )

    const createInviteUseCase = new CreateGroupInviteUseCase(this.vaultInvitesServer)
    const createInviteResult = await createInviteUseCase.execute({
      vaultSystemIdentifier: params.group.vault_system_identifier,
      inviteeUuid: params.contact.contactUuid,
      inviterPublicKey: params.inviterPublicKey,
      encryptedVaultKeyContent,
      inviteType: GroupInviteType.Join,
      permissions: params.permissions,
    })

    return createInviteResult
  }
}
