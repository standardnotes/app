import { AsymmetricMessageSharedVaultInvite } from '@standardnotes/models'
import { SharedVaultInviteServerHash } from '@standardnotes/responses'

export type InviteRecord = {
  invite: SharedVaultInviteServerHash
  message: AsymmetricMessageSharedVaultInvite
  trusted: boolean
}
