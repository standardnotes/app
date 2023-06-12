import { SyncServiceInterface } from './../../Sync/SyncServiceInterface'
import { AsymmetricMessageSharedVaultInvite } from '@standardnotes/models'
import { SharedVaultInvitesServerInterface } from '@standardnotes/api'
import { SharedVaultInviteServerHash } from '@standardnotes/responses'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { HandleTrustedSharedVaultInviteMessage } from '../../AsymmetricMessage/UseCase/HandleTrustedSharedVaultInviteMessage'
import { ContactServiceInterface } from '../../Contacts/ContactServiceInterface'

export class AcceptTrustedSharedVaultInvite {
  constructor(
    private vaultInvitesServer: SharedVaultInvitesServerInterface,
    private items: ItemManagerInterface,
    private sync: SyncServiceInterface,
    private contacts: ContactServiceInterface,
  ) {}

  async execute(dto: {
    invite: SharedVaultInviteServerHash
    message: AsymmetricMessageSharedVaultInvite
  }): Promise<'inserted' | 'changed'> {
    const useCase = new HandleTrustedSharedVaultInviteMessage(this.items, this.sync, this.contacts)
    const modificationType = await useCase.execute(dto.message)

    await this.vaultInvitesServer.acceptInvite({
      sharedVaultUuid: dto.invite.shared_vault_uuid,
      inviteUuid: dto.invite.uuid,
    })

    return modificationType
  }
}
