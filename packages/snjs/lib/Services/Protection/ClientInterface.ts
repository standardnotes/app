import { ChallengeReason } from '@standardnotes/services'
import { DecryptedItem } from '@standardnotes/models'
import { TimingDisplayOption, MobileUnlockTiming } from './MobileUnlockTiming'

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
}
