import { MutatorClientInterface } from './../../Mutator/MutatorClientInterface'
import { SyncServiceInterface } from './../../Sync/SyncServiceInterface'
import { AsymmetricMessageSharedVaultInvite } from '@standardnotes/models'
import { SharedVaultInvitesServerInterface } from '@standardnotes/api'
import { SharedVaultInviteServerHash } from '@standardnotes/responses'
import { HandleTrustedSharedVaultInviteMessage } from '../../AsymmetricMessage/UseCase/HandleTrustedSharedVaultInviteMessage'
import { ContactServiceInterface } from '../../Contacts/ContactServiceInterface'

export class AcceptTrustedSharedVaultInvite {
  constructor(
    private vaultInvitesServer: SharedVaultInvitesServerInterface,
    private mutator: MutatorClientInterface,
    private sync: SyncServiceInterface,
    private contacts: ContactServiceInterface,
  ) {}

  async execute(dto: {
    invite: SharedVaultInviteServerHash
    message: AsymmetricMessageSharedVaultInvite
  }): Promise<void> {
    const useCase = new HandleTrustedSharedVaultInviteMessage(this.mutator, this.sync, this.contacts)
    await useCase.execute(dto.message, dto.invite.shared_vault_uuid, dto.invite.sender_uuid)

    await this.vaultInvitesServer.acceptInvite({
      sharedVaultUuid: dto.invite.shared_vault_uuid,
      inviteUuid: dto.invite.uuid,
    })
  }
}
