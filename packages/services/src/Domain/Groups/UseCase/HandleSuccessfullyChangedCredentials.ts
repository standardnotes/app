import { GroupInvitesServerInterface, GroupServerInterface } from '@standardnotes/api'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import {
  ClientDisplayableError,
  GroupInviteServerHash,
  GroupServerHash,
  isErrorResponse,
} from '@standardnotes/responses'
import { ContactServiceInterface } from '../../Contacts/ContactServiceInterface'
import { SuccessfullyChangedCredentialsEventData } from '../../Session/SuccessfullyChangedCredentialsEventData'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'

/**
 * When the local client initiates a change of credentials, it is also responsible for
 * reencrypting invites the user has addressed for others.
 */
export class HandleSuccessfullyChangedCredentials {
  constructor(
    private groupServer: GroupServerInterface,
    private groupInvitesServer: GroupInvitesServerInterface,
    private encryption: EncryptionProviderInterface,
    private contacts: ContactServiceInterface,
    private items: ItemManagerInterface,
  ) {}

  async execute(data: SuccessfullyChangedCredentialsEventData): Promise<ClientDisplayableError[]> {
    await this.contacts.refreshAllContactsAfterPublicKeyChange()

    await this.groupInvitesServer.deleteAllInboundInvites()

    const errors = await this.updateAllOutboundInvites(data)

    return errors
  }

  private async updateAllOutboundInvites(params: {
    newPublicKey: string
    newPrivateKey: string
  }): Promise<ClientDisplayableError[]> {
    const groupsResponse = await this.groupServer.getGroups()

    if (isErrorResponse(groupsResponse)) {
      return [ClientDisplayableError.FromString('Failed to get groups current user')]
    }

    const groups = groupsResponse.data.groups

    const getOutboundInvitesResponse = await this.groupInvitesServer.getOutboundUserInvites()

    if (isErrorResponse(getOutboundInvitesResponse)) {
      return [ClientDisplayableError.FromString('Failed to get outbound user invites for current user')]
    }

    const errors: ClientDisplayableError[] = []

    const outboundInvites = getOutboundInvitesResponse.data.invites
    for (const invite of outboundInvites) {
      const group = groups.find((g) => g.uuid === invite.group_uuid)
      if (!group) {
        errors.push(ClientDisplayableError.FromString('Failed to find group for invite'))
        continue
      }

      const error = await this.updateInvite({
        group,
        invite,
        newPublicKey: params.newPublicKey,
        newPrivateKey: params.newPrivateKey,
      })

      if (error) {
        errors.push(error)
      }
    }

    return errors
  }

  private async updateInvite(params: {
    invite: GroupInviteServerHash
    group: GroupServerHash
    newPublicKey: string
    newPrivateKey: string
  }): Promise<ClientDisplayableError | undefined> {
    const isEncryptedWithNewPublicKey = params.invite.inviter_public_key === params.newPublicKey
    if (isEncryptedWithNewPublicKey) {
      return undefined
    }

    const vaultKeyCopy = this.items.getPrimarySyncedVaultKeyCopy(params.group.vault_system_identifier)
    if (!vaultKeyCopy) {
      return ClientDisplayableError.FromString('Failed to find vault key for invite')
    }

    const trustedContact = this.contacts.findTrustedContact(params.invite.user_uuid)
    if (!trustedContact) {
      return ClientDisplayableError.FromString('Failed to find contact for invite')
    }

    const newEncryptedVaultData = this.encryption.encryptVaultKeyContentWithRecipientPublicKey(
      vaultKeyCopy.content,
      params.newPrivateKey,
      trustedContact.publicKey,
    )

    const updateInviteResponse = await this.groupInvitesServer.updateInvite({
      groupUuid: params.invite.group_uuid,
      inviteUuid: params.invite.uuid,
      inviterPublicKey: params.newPublicKey,
      encryptedVaultKeyContent: newEncryptedVaultData,
    })

    if (isErrorResponse(updateInviteResponse)) {
      return ClientDisplayableError.FromString('Failed to update invite')
    }

    return undefined
  }
}
