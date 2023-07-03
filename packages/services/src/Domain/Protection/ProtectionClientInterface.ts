import { DecryptedItem, DecryptedItemInterface, FileItem, SNNote } from '@standardnotes/models'
import { ChallengeReason } from '../Challenge'
import { MobileUnlockTiming } from './MobileUnlockTiming'
import { TimingDisplayOption } from './TimingDisplayOption'

export interface ProtectionsClientInterface {
  authorizeProtectedActionForItems<T extends DecryptedItem>(files: T[], challengeReason: ChallengeReason): Promise<T[]>
  authorizeItemAccess(item: DecryptedItem): Promise<boolean>
  getMobileBiometricsTiming(): MobileUnlockTiming | undefined
  getMobilePasscodeTiming(): MobileUnlockTiming | undefined
  setMobileBiometricsTiming(timing: MobileUnlockTiming): void
  setMobilePasscodeTiming(timing: MobileUnlockTiming): void
  setMobileScreenshotPrivacyEnabled(isEnabled: boolean): void
  getMobileScreenshotPrivacyEnabled(): boolean
  getMobilePasscodeTimingOptions(): TimingDisplayOption[]
  getMobileBiometricsTimingOptions(): TimingDisplayOption[]
  hasBiometricsEnabled(): boolean
  enableBiometrics(): boolean
  disableBiometrics(): Promise<boolean>
  authorizeAction(
    reason: ChallengeReason,
    dto: { fallBackToAccountPassword: boolean; requireAccountPassword: boolean; forcePrompt: boolean },
  ): Promise<boolean>
  authorizeAddingPasscode(): Promise<boolean>
  authorizeRemovingPasscode(): Promise<boolean>
  authorizeChangingPasscode(): Promise<boolean>
  authorizeFileImport(): Promise<boolean>
  protectItems<I extends DecryptedItemInterface>(items: I[]): Promise<I[]>
  unprotectItems<I extends DecryptedItemInterface>(items: I[], reason: ChallengeReason): Promise<I[] | undefined>
  protectNote(note: SNNote): Promise<SNNote>
  unprotectNote(note: SNNote): Promise<SNNote | undefined>
  protectNotes(notes: SNNote[]): Promise<SNNote[]>
  unprotectNotes(notes: SNNote[]): Promise<SNNote[]>
  protectFile(file: FileItem): Promise<FileItem>
  unprotectFile(file: FileItem): Promise<FileItem | undefined>
}
