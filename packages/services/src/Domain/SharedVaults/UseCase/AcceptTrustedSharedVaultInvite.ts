import { SyncServiceInterface } from './../../Sync/SyncServiceInterface'
import { AsymmetricMessageSharedVaultRootKeyChanged } from '@standardnotes/models'
import { SharedVaultInvitesServerInterface } from '@standardnotes/api'
import { SharedVaultInviteServerHash } from '@standardnotes/responses'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { HandleTrustedSharedVaultRootKeyChangedMessage } from '../../AsymmetricMessage/UseCase/HandleTrustedSharedVaultRootKeyChangedMessage'

export class AcceptTrustedSharedVaultInvite {
  constructor(
    private vaultInvitesServer: SharedVaultInvitesServerInterface,
    private items: ItemManagerInterface,
    private sync: SyncServiceInterface,
  ) {}

  async execute(dto: {
    invite: SharedVaultInviteServerHash
    message: AsymmetricMessageSharedVaultRootKeyChanged
  }): Promise<'inserted' | 'changed'> {
    const useCase = new HandleTrustedSharedVaultRootKeyChangedMessage(this.items, this.sync)
    const modificationType = await useCase.execute(dto.message)

    await this.vaultInvitesServer.acceptInvite({
      sharedVaultUuid: dto.invite.shared_vault_uuid,
      inviteUuid: dto.invite.uuid,
    })

    return modificationType
  }
}
