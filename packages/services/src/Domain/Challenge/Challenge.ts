import { assertUnreachable } from '@standardnotes/utils'
import { ChallengeModalTitle, ChallengeStrings } from '../Strings/Messages'
import { ChallengeInterface } from './ChallengeInterface'
import { ChallengePrompt } from './Prompt/ChallengePrompt'
import { ChallengeReason } from './Types/ChallengeReason'
import { ChallengeValidation } from './Types/ChallengeValidation'
import { ChallengeValue } from './Types/ChallengeValue'

/**
 * A challenge is a stateless description of what the client needs to provide
 * in order to proceed.
 */
export class Challenge implements ChallengeInterface {
  public readonly id = Math.random()
  customHandler?: (challenge: ChallengeInterface, values: ChallengeValue[]) => Promise<void>

  constructor(
    public readonly prompts: ChallengePrompt[],
    public readonly reason: ChallengeReason,
    public readonly cancelable: boolean,
    public readonly _heading?: string,
    public readonly _subheading?: string,
  ) {}

  /** Outside of the modal, this is the title of the modal itself */
  get modalTitle(): string {
    switch (this.reason) {
      case ChallengeReason.Migration:
        return ChallengeModalTitle.Migration
      default:
        return ChallengeModalTitle.Generic
    }
  }

  /** Inside of the modal, this is the H1 */
  get heading(): string | undefined {
    if (this._heading) {
      return this._heading
    } else {
      switch (this.reason) {
        case ChallengeReason.ApplicationUnlock:
          return ChallengeStrings.UnlockApplication
        case ChallengeReason.Migration:
          return ChallengeStrings.EnterLocalPasscode
        case ChallengeReason.ResaveRootKey:
          return ChallengeStrings.EnterPasscodeForRootResave
        case ChallengeReason.ProtocolUpgrade:
          return ChallengeStrings.EnterCredentialsForProtocolUpgrade
        case ChallengeReason.AccessProtectedNote:
          return ChallengeStrings.NoteAccess
        case ChallengeReason.AccessProtectedFile:
          return ChallengeStrings.FileAccess
        case ChallengeReason.ImportFile:
          return ChallengeStrings.ImportFile
        case ChallengeReason.AddPasscode:
          return ChallengeStrings.AddPasscode
        case ChallengeReason.RemovePasscode:
          return ChallengeStrings.RemovePasscode
        case ChallengeReason.ChangePasscode:
          return ChallengeStrings.ChangePasscode
        case ChallengeReason.ChangeAutolockInterval:
          return ChallengeStrings.ChangeAutolockInterval
        case ChallengeReason.CreateDecryptedBackupWithProtectedItems:
          return ChallengeStrings.EnterCredentialsForDecryptedBackupDownload
        case ChallengeReason.RevokeSession:
          return ChallengeStrings.RevokeSession
        case ChallengeReason.DecryptEncryptedFile:
          return ChallengeStrings.DecryptEncryptedFile
        case ChallengeReason.ExportBackup:
          return ChallengeStrings.ExportBackup
        case ChallengeReason.DisableBiometrics:
          return ChallengeStrings.DisableBiometrics
        case ChallengeReason.UnprotectNote:
          return ChallengeStrings.UnprotectNote
        case ChallengeReason.UnprotectFile:
          return ChallengeStrings.UnprotectFile
        case ChallengeReason.SearchProtectedNotesText:
          return ChallengeStrings.SearchProtectedNotesText
        case ChallengeReason.SelectProtectedNote:
          return ChallengeStrings.SelectProtectedNote
        case ChallengeReason.DisableMfa:
          return ChallengeStrings.DisableMfa
        case ChallengeReason.DeleteAccount:
          return ChallengeStrings.DeleteAccount
        case ChallengeReason.AuthorizeNoteForListed:
          return ChallengeStrings.ListedAuthorization
        case ChallengeReason.Custom:
          return ''
        default:
          return assertUnreachable(this.reason)
      }
    }
  }

  /** Inside of the modal, this is the H2 */
  get subheading(): string | undefined {
    if (this._subheading) {
      return this._subheading
    }

    switch (this.reason) {
      case ChallengeReason.Migration:
        return ChallengeStrings.EnterPasscodeForMigration
      default:
        return undefined
    }
  }

  hasPromptForValidationType(type: ChallengeValidation): boolean {
    for (const prompt of this.prompts) {
      if (prompt.validation === type) {
        return true
      }
    }
    return false
  }
}
