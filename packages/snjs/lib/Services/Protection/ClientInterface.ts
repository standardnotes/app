import { ChallengeReason } from '@standardnotes/services'
import { DecryptedItem } from '@standardnotes/models'

export interface ProtectionsClientInterface {
  authorizeProtectedActionForItems<T extends DecryptedItem>(files: T[], challengeReason: ChallengeReason): Promise<T[]>

  authorizeItemAccess(item: DecryptedItem): Promise<boolean>
}
