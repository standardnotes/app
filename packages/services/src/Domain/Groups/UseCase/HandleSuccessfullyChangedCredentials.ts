import { GroupInvitesServerInterface } from '@standardnotes/api'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { ClientDisplayableError, GroupInviteServerHash, isErrorResponse } from '@standardnotes/responses'
import { ContactServiceInterface } from '../../Contacts/ContactServiceInterface'
import { SuccessfullyChangedCredentialsEventData } from '../../Session/SuccessfullyChangedCredentialsEventData'

/**
 * When the local client initiates a change of credentials, it is also responsible for
 * reencrypting invites the user has addressed for others.
 */
export class HandleSuccessfullyChangedCredentials {
  constructor(
    private groupInvitesServer: GroupInvitesServerInterface,
    private encryption: EncryptionProviderInterface,
    private contacts: ContactServiceInterface,
  ) {}

  async execute(data: SuccessfullyChangedCredentialsEventData): Promise<ClientDisplayableError[]> {
    const { newPublicKey, newPrivateKey } = data

    const getOutboundInvitesResponse = await this.groupInvitesServer.getOutboundUserInvites()
    if (isErrorResponse(getOutboundInvitesResponse)) {
      return [ClientDisplayableError.FromString('Failed to get outbound user invites for current user')]
    }

    const errors: ClientDisplayableError[] = []

    const outboundInvites = getOutboundInvitesResponse.data.invites
    for (const invite of outboundInvites) {
      const error = await this.updateInvite({
        invite,
        newPublicKey,
        newPrivateKey,
      })

      if (error) {
        errors.push(error)
      }
    }

    return errors
  }

  private async updateInvite({
    invite,
    newPublicKey,
    newPrivateKey,
  }: {
    invite: GroupInviteServerHash
    newPublicKey: string
    newPrivateKey: string
  }): Promise<ClientDisplayableError | undefined> {
    const isEncryptedWithNewPublicKey = invite.inviter_public_key === newPublicKey
    if (isEncryptedWithNewPublicKey) {
      return undefined
    }

    const groupKey = this.encryption.getGroupKey(invite.group_uuid)
    if (!groupKey) {
      return ClientDisplayableError.FromString('Failed to find group key for invite')
    }

    const trustedContact = this.contacts.findTrustedContact(invite.user_uuid)
    if (!trustedContact) {
      return ClientDisplayableError.FromString('Failed to find contact for invite')
    }

    const newEncryptedGroupData = this.encryption.encryptGroupDataWithRecipientPublicKey(
      groupKey.content,
      newPrivateKey,
      trustedContact.publicKey,
    )

    const updateInviteResponse = await this.groupInvitesServer.updateInvite({
      groupUuid: invite.group_uuid,
      inviteUuid: invite.uuid,
      inviterPublicKey: newPublicKey,
      encryptedGroupData: newEncryptedGroupData,
    })

    if (isErrorResponse(updateInviteResponse)) {
      return ClientDisplayableError.FromString('Failed to update invite')
    }

    return undefined
  }
}
