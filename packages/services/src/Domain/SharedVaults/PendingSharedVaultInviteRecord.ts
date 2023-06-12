import { AsymmetricMessageSharedVaultInvite } from '@standardnotes/models'
import { SharedVaultInviteServerHash } from '@standardnotes/responses'

export type PendingSharedVaultInviteRecord = {
  invite: SharedVaultInviteServerHash
  message: AsymmetricMessageSharedVaultInvite
  trusted: boolean
}
