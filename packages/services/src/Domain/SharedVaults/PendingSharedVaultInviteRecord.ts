import { AsymmetricMessageSharedVaultRootKeyChanged } from '@standardnotes/models'
import { SharedVaultInviteServerHash } from '@standardnotes/responses'

export type PendingSharedVaultInviteRecord = {
  invite: SharedVaultInviteServerHash
  message: AsymmetricMessageSharedVaultRootKeyChanged
  trusted: boolean
}
