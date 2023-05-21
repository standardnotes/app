import { ContentType } from '@standardnotes/common'
import { GroupKeyInterface, Predicate } from '@standardnotes/models'
import { GroupInvitesServerInterface } from '@standardnotes/api'
import { ContactServiceInterface, ItemManagerInterface } from '@standardnotes/services'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { ClientDisplayableError, isErrorResponse } from '@standardnotes/responses'
import { SuccessfullyChangedCredentialsEventData } from '@Lib/Services/Session/SuccessfullyChangedCredentialsEventData'

/**
 * When the local client initiates a change of credentials, it is also responsible for
 * reencrypting invites the user has addressed for others.
 */
export class HandleSuccessfullyChangedCredentials {
  constructor(
    private groupInvitesServer: GroupInvitesServerInterface,
    private items: ItemManagerInterface,
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
      const isEncryptedWithNewPublicKey = invite.inviter_public_key === newPublicKey
      if (isEncryptedWithNewPublicKey) {
        continue
      }

      const groupKey = this.items.itemsMatchingPredicate<GroupKeyInterface>(
        ContentType.GroupKey,
        new Predicate<GroupKeyInterface>('groupUuid', '=', invite.group_uuid),
      )[0]

      if (!groupKey) {
        errors.push(ClientDisplayableError.FromString('Failed to find group key for invite'))
        continue
      }

      const trustedContact = this.contacts.findContact(invite.user_uuid)

      if (!trustedContact) {
        errors.push(ClientDisplayableError.FromString('Failed to find contact for invite'))
        continue
      }

      const newEncryptedGroupKey = this.encryption.encryptGroupKeyWithRecipientPublicKey(
        groupKey.groupKey,
        newPrivateKey,
        trustedContact.contactPublicKey,
      )

      const updateInviteResponse = await this.groupInvitesServer.updateInvite({
        groupUuid: invite.group_uuid,
        inviteUuid: invite.uuid,
        inviterPublicKey: newPublicKey,
        encryptedGroupKey: newEncryptedGroupKey,
      })

      if (isErrorResponse(updateInviteResponse)) {
        errors.push(ClientDisplayableError.FromString('Failed to update invite'))
      }
    }

    return errors
  }
}
