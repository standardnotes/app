import { ChallengeService } from './../Challenge/ChallengeService'
import { SNLog } from '@Lib/Log'
import {
  DecryptedItem,
  DecryptedItemInterface,
  DecryptedItemMutator,
  FileItem,
  MutationType,
  SNNote,
} from '@standardnotes/models'
import { DiskStorageService } from '@Lib/Services/Storage/DiskStorageService'
import { isNullOrUndefined } from '@standardnotes/utils'
import {
  AbstractService,
  InternalEventBusInterface,
  StorageValueModes,
  ApplicationStage,
  StorageKey,
  Challenge,
  ChallengeReason,
  ChallengePrompt,
  ChallengeValidation,
  EncryptionService,
  MobileUnlockTiming,
  TimingDisplayOption,
  ProtectionsClientInterface,
  MutatorClientInterface,
  InternalEventHandlerInterface,
  InternalEventInterface,
  ApplicationEvent,
  ApplicationStageChangedEventPayload,
  ProtectionEvent,
} from '@standardnotes/services'
import { ContentType } from '@standardnotes/domain-core'
import { isValidProtectionSessionLength } from './isValidProtectionSessionLength'
import { UnprotectedAccessSecondsDuration } from './UnprotectedAccessSecondsDuration'

/**
 * Enforces certain actions to require extra authentication,
 * like viewing a protected note, as well as managing how long that
 * authentication should be valid for.
 */
export class ProtectionService
  extends AbstractService<ProtectionEvent>
  implements ProtectionsClientInterface, InternalEventHandlerInterface
{
  private sessionExpiryTimeout = -1
  private mobilePasscodeTiming: MobileUnlockTiming | undefined = MobileUnlockTiming.OnQuit
  private mobileBiometricsTiming: MobileUnlockTiming | undefined = MobileUnlockTiming.OnQuit

  private isBiometricsSoftLockEngaged = false
  private applicationStarted = false

  constructor(
    private encryption: EncryptionService,
    private mutator: MutatorClientInterface,
    private challenges: ChallengeService,
    private storage: DiskStorageService,
    protected override internalEventBus: InternalEventBusInterface,
  ) {
    super(internalEventBus)
  }

  public override deinit(): void {
    clearTimeout(this.sessionExpiryTimeout)
    ;(this.encryption as unknown) = undefined
    ;(this.challenges as unknown) = undefined
    ;(this.storage as unknown) = undefined
    super.deinit()
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    if (event.type === ApplicationEvent.ApplicationStageChanged) {
      const stage = (event.payload as ApplicationStageChangedEventPayload).stage
      if (stage === ApplicationStage.LoadedDatabase_12) {
        this.updateSessionExpiryTimer(this.getSessionExpiryDate())
        this.mobilePasscodeTiming = this.getMobilePasscodeTiming()
        this.mobileBiometricsTiming = this.getMobileBiometricsTiming()
      }
    } else if (event.type === ApplicationEvent.Started) {
      this.applicationStarted = true
    }
  }

  async isLocked(): Promise<boolean> {
    if (!this.applicationStarted) {
      return true
    }

    const isPasscodeLocked = await this.encryption.isPasscodeLocked()
    return isPasscodeLocked || this.isBiometricsSoftLockEngaged
  }

  public softLockBiometrics(): void {
    const challenge = new Challenge(
      [new ChallengePrompt(ChallengeValidation.Biometric)],
      ChallengeReason.ApplicationUnlock,
      false,
    )

    void this.challenges.promptForChallengeResponse(challenge)

    this.isBiometricsSoftLockEngaged = true
    void this.notifyEvent(ProtectionEvent.BiometricsSoftLockEngaged)

    this.challenges.addChallengeObserver(challenge, {
      onComplete: () => {
        this.isBiometricsSoftLockEngaged = false
        void this.notifyEvent(ProtectionEvent.BiometricsSoftLockDisengaged)
      },
    })
  }

  public hasProtectionSources(): boolean {
    return this.encryption.hasAccount() || this.encryption.hasPasscode() || this.hasBiometricsEnabled()
  }

  public hasUnprotectedAccessSession(): boolean {
    if (!this.hasProtectionSources()) {
      return true
    }
    return this.getSessionExpiryDate() > new Date()
  }

  public hasBiometricsEnabled(): boolean {
    const biometricsState = this.storage.getValue(StorageKey.BiometricsState, StorageValueModes.Nonwrapped)
    return Boolean(biometricsState)
  }

  public enableBiometrics(): boolean {
    if (this.hasBiometricsEnabled()) {
      SNLog.onError(Error('Tried to enable biometrics when they already are enabled.'))
      return false
    }

    this.storage.setValue(StorageKey.BiometricsState, true, StorageValueModes.Nonwrapped)

    return true
  }

  public async disableBiometrics(): Promise<boolean> {
    if (!this.hasBiometricsEnabled()) {
      SNLog.onError(Error('Tried to disable biometrics when they already are disabled.'))
      return false
    }

    if (await this.validateOrRenewSession(ChallengeReason.DisableBiometrics)) {
      this.storage.setValue(StorageKey.BiometricsState, false, StorageValueModes.Nonwrapped)
      return true
    } else {
      return false
    }
  }

  public createLaunchChallenge(): Challenge | undefined {
    const prompts: ChallengePrompt[] = []
    if (this.hasBiometricsEnabled()) {
      prompts.push(new ChallengePrompt(ChallengeValidation.Biometric))
    }
    if (this.encryption.hasPasscode()) {
      prompts.push(new ChallengePrompt(ChallengeValidation.LocalPasscode))
    }
    if (prompts.length > 0) {
      return new Challenge(prompts, ChallengeReason.ApplicationUnlock, false)
    } else {
      return undefined
    }
  }

  async authorizeProtectedActionForItems<T extends DecryptedItem>(
    items: T[],
    challengeReason: ChallengeReason,
  ): Promise<T[]> {
    let sessionValidation: Promise<boolean> | undefined
    const authorizedItems = []
    for (const item of items) {
      const needsAuthorization = item.protected && !this.hasUnprotectedAccessSession()
      if (needsAuthorization && !sessionValidation) {
        sessionValidation = this.validateOrRenewSession(challengeReason)
      }
      if (!needsAuthorization || (await sessionValidation)) {
        authorizedItems.push(item)
      }
    }
    return authorizedItems
  }

  async authorizeItemAccess(item: DecryptedItem): Promise<boolean> {
    if (!item.protected) {
      return true
    }

    return this.authorizeAction(
      item.content_type === ContentType.TYPES.Note
        ? ChallengeReason.AccessProtectedNote
        : ChallengeReason.AccessProtectedFile,
      { fallBackToAccountPassword: true, requireAccountPassword: false, forcePrompt: false },
    )
  }

  authorizeAddingPasscode(): Promise<boolean> {
    return this.authorizeAction(ChallengeReason.AddPasscode, {
      fallBackToAccountPassword: true,
      requireAccountPassword: false,
      forcePrompt: false,
    })
  }

  authorizeChangingPasscode(): Promise<boolean> {
    return this.authorizeAction(ChallengeReason.ChangePasscode, {
      fallBackToAccountPassword: true,
      requireAccountPassword: false,
      forcePrompt: false,
    })
  }

  authorizeRemovingPasscode(): Promise<boolean> {
    return this.authorizeAction(ChallengeReason.RemovePasscode, {
      fallBackToAccountPassword: true,
      requireAccountPassword: false,
      forcePrompt: false,
    })
  }

  authorizeSearchingProtectedNotesText(): Promise<boolean> {
    return this.authorizeAction(ChallengeReason.SearchProtectedNotesText, {
      fallBackToAccountPassword: true,
      requireAccountPassword: false,
      forcePrompt: false,
    })
  }

  authorizeFileImport(): Promise<boolean> {
    return this.authorizeAction(ChallengeReason.ImportFile, {
      fallBackToAccountPassword: true,
      requireAccountPassword: false,
      forcePrompt: false,
    })
  }

  async authorizeBackupCreation(): Promise<boolean> {
    return this.authorizeAction(ChallengeReason.ExportBackup, {
      fallBackToAccountPassword: true,
      requireAccountPassword: false,
      forcePrompt: false,
    })
  }

  async authorizeMfaDisable(): Promise<boolean> {
    return this.authorizeAction(ChallengeReason.DisableMfa, {
      fallBackToAccountPassword: true,
      requireAccountPassword: true,
      forcePrompt: false,
    })
  }

  async authorizeAutolockIntervalChange(): Promise<boolean> {
    return this.authorizeAction(ChallengeReason.ChangeAutolockInterval, {
      fallBackToAccountPassword: true,
      requireAccountPassword: false,
      forcePrompt: false,
    })
  }

  async authorizeSessionRevoking(): Promise<boolean> {
    return this.authorizeAction(ChallengeReason.RevokeSession, {
      fallBackToAccountPassword: true,
      requireAccountPassword: false,
      forcePrompt: false,
    })
  }

  async authorizeListedPublishing(): Promise<boolean> {
    return this.authorizeAction(ChallengeReason.AuthorizeNoteForListed, {
      fallBackToAccountPassword: true,
      requireAccountPassword: false,
      forcePrompt: true,
    })
  }

  async authorizeAction(
    reason: ChallengeReason,
    dto: { fallBackToAccountPassword: boolean; requireAccountPassword: boolean; forcePrompt: boolean },
  ): Promise<boolean> {
    return this.validateOrRenewSession(reason, dto)
  }

  getMobilePasscodeTimingOptions(): TimingDisplayOption[] {
    return [
      {
        title: 'Immediately',
        key: MobileUnlockTiming.Immediately,
        selected: this.mobilePasscodeTiming === MobileUnlockTiming.Immediately,
      },
      {
        title: 'On Quit',
        key: MobileUnlockTiming.OnQuit,
        selected: this.mobilePasscodeTiming === MobileUnlockTiming.OnQuit,
      },
    ]
  }

  getMobileBiometricsTimingOptions(): TimingDisplayOption[] {
    return [
      {
        title: 'Immediately',
        key: MobileUnlockTiming.Immediately,
        selected: this.mobileBiometricsTiming === MobileUnlockTiming.Immediately,
      },
      {
        title: 'On Quit',
        key: MobileUnlockTiming.OnQuit,
        selected: this.mobileBiometricsTiming === MobileUnlockTiming.OnQuit,
      },
    ]
  }

  getMobileBiometricsTiming(): MobileUnlockTiming | undefined {
    return this.storage.getValue<MobileUnlockTiming | undefined>(
      StorageKey.MobileBiometricsTiming,
      StorageValueModes.Nonwrapped,
      MobileUnlockTiming.OnQuit,
    )
  }

  getMobilePasscodeTiming(): MobileUnlockTiming | undefined {
    return this.storage.getValue<MobileUnlockTiming | undefined>(
      StorageKey.MobilePasscodeTiming,
      StorageValueModes.Nonwrapped,
      MobileUnlockTiming.OnQuit,
    )
  }

  setMobileBiometricsTiming(timing: MobileUnlockTiming): void {
    this.storage.setValue(StorageKey.MobileBiometricsTiming, timing, StorageValueModes.Nonwrapped)
    this.mobileBiometricsTiming = timing
  }

  setMobilePasscodeTiming(timing: MobileUnlockTiming): void {
    this.storage.setValue(StorageKey.MobilePasscodeTiming, timing, StorageValueModes.Nonwrapped)
    this.mobilePasscodeTiming = timing
  }

  setMobileScreenshotPrivacyEnabled(isEnabled: boolean) {
    return this.storage.setValue(StorageKey.MobileScreenshotPrivacyEnabled, isEnabled, StorageValueModes.Default)
  }

  getMobileScreenshotPrivacyEnabled(): boolean {
    return this.storage.getValue(StorageKey.MobileScreenshotPrivacyEnabled, StorageValueModes.Default, false)
  }

  private async validateOrRenewSession(
    reason: ChallengeReason,
    { fallBackToAccountPassword = true, requireAccountPassword = false, forcePrompt = false } = {},
  ): Promise<boolean> {
    if (this.getSessionExpiryDate() > new Date() && !forcePrompt) {
      return true
    }

    const prompts: ChallengePrompt[] = []

    if (this.hasBiometricsEnabled()) {
      prompts.push(new ChallengePrompt(ChallengeValidation.Biometric))
    }

    if (this.encryption.hasPasscode()) {
      prompts.push(new ChallengePrompt(ChallengeValidation.LocalPasscode))
    }

    if (requireAccountPassword) {
      if (!this.encryption.hasAccount()) {
        throw Error('Requiring account password for challenge with no account')
      }
      prompts.push(new ChallengePrompt(ChallengeValidation.AccountPassword))
    }

    if (prompts.length === 0) {
      if (fallBackToAccountPassword && this.encryption.hasAccount()) {
        prompts.push(new ChallengePrompt(ChallengeValidation.AccountPassword))
      } else {
        return true
      }
    }
    const lastSessionLength = this.getLastSessionLength()
    const chosenSessionLength = isValidProtectionSessionLength(lastSessionLength)
      ? lastSessionLength
      : UnprotectedAccessSecondsDuration.OneMinute
    prompts.push(
      new ChallengePrompt(
        ChallengeValidation.ProtectionSessionDuration,
        undefined,
        undefined,
        undefined,
        undefined,
        chosenSessionLength,
      ),
    )

    const response = await this.challenges.promptForChallengeResponse(new Challenge(prompts, reason, true))

    if (response) {
      const length = response.values.find(
        (value) => value.prompt.validation === ChallengeValidation.ProtectionSessionDuration,
      )?.value
      if (isNullOrUndefined(length)) {
        SNLog.error(Error('No valid protection session length found. Got ' + length))
      } else {
        this.setSessionLength(length as UnprotectedAccessSecondsDuration)
      }
      return true
    } else {
      return false
    }
  }

  public getSessionExpiryDate(): Date {
    const expiresAt = this.storage.getValue<number>(StorageKey.ProtectionExpirey)
    if (expiresAt) {
      return new Date(expiresAt)
    } else {
      return new Date()
    }
  }

  public clearSession(): Promise<void> {
    void this.setSessionExpiryDate(new Date())
    return this.notifyEvent(ProtectionEvent.UnprotectedSessionExpired)
  }

  private setSessionExpiryDate(date: Date) {
    this.storage.setValue(StorageKey.ProtectionExpirey, date)
  }

  private getLastSessionLength(): UnprotectedAccessSecondsDuration | undefined {
    return this.storage.getValue(StorageKey.ProtectionSessionLength)
  }

  private setSessionLength(length: UnprotectedAccessSecondsDuration): void {
    this.storage.setValue(StorageKey.ProtectionSessionLength, length)
    const expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + length)
    this.setSessionExpiryDate(expiresAt)
    this.updateSessionExpiryTimer(expiresAt)
    void this.notifyEvent(ProtectionEvent.UnprotectedSessionBegan)
  }

  private updateSessionExpiryTimer(expiryDate: Date) {
    clearTimeout(this.sessionExpiryTimeout)
    const timer: TimerHandler = () => {
      void this.clearSession()
    }
    this.sessionExpiryTimeout = setTimeout(timer, expiryDate.getTime() - Date.now())
  }

  async protectItems<I extends DecryptedItemInterface>(items: I[]): Promise<I[]> {
    const protectedItems = await this.mutator.changeItems<DecryptedItemMutator, I>(
      items,
      (mutator) => {
        mutator.protected = true
      },
      MutationType.NoUpdateUserTimestamps,
    )

    return protectedItems
  }

  async unprotectItems<I extends DecryptedItemInterface>(
    items: I[],
    reason: ChallengeReason,
  ): Promise<I[] | undefined> {
    if (
      !(await this.authorizeAction(reason, {
        fallBackToAccountPassword: true,
        requireAccountPassword: false,
        forcePrompt: false,
      }))
    ) {
      return undefined
    }

    const unprotectedItems = await this.mutator.changeItems<DecryptedItemMutator, I>(
      items,
      (mutator) => {
        mutator.protected = false
      },
      MutationType.NoUpdateUserTimestamps,
    )

    return unprotectedItems
  }

  public async protectNote(note: SNNote): Promise<SNNote> {
    const result = await this.protectItems([note])
    return result[0]
  }

  public async unprotectNote(note: SNNote): Promise<SNNote | undefined> {
    const result = await this.unprotectItems([note], ChallengeReason.UnprotectNote)
    return result ? result[0] : undefined
  }

  public async protectNotes(notes: SNNote[]): Promise<SNNote[]> {
    return this.protectItems(notes)
  }

  public async unprotectNotes(notes: SNNote[]): Promise<SNNote[]> {
    const results = await this.unprotectItems(notes, ChallengeReason.UnprotectNote)
    return results || []
  }

  async protectFile(file: FileItem): Promise<FileItem> {
    const result = await this.protectItems([file])
    return result[0]
  }

  async unprotectFile(file: FileItem): Promise<FileItem | undefined> {
    const result = await this.unprotectItems([file], ChallengeReason.UnprotectFile)
    return result ? result[0] : undefined
  }
}
