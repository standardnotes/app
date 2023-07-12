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
} from '@standardnotes/services'
import { ContentType } from '@standardnotes/domain-core'

export enum ProtectionEvent {
  UnprotectedSessionBegan = 'UnprotectedSessionBegan',
  UnprotectedSessionExpired = 'UnprotectedSessionExpired',
}

export const ProposedSecondsToDeferUILevelSessionExpirationDuringActiveInteraction = 30

export enum UnprotectedAccessSecondsDuration {
  OneMinute = 60,
  FiveMinutes = 300,
  OneHour = 3600,
  OneWeek = 604800,
}

export function isValidProtectionSessionLength(number: unknown): boolean {
  return typeof number === 'number' && Object.values(UnprotectedAccessSecondsDuration).includes(number)
}

export const ProtectionSessionDurations = [
  {
    valueInSeconds: UnprotectedAccessSecondsDuration.OneMinute,
    label: '1 Minute',
  },
  {
    valueInSeconds: UnprotectedAccessSecondsDuration.FiveMinutes,
    label: '5 Minutes',
  },
  {
    valueInSeconds: UnprotectedAccessSecondsDuration.OneHour,
    label: '1 Hour',
  },
  {
    valueInSeconds: UnprotectedAccessSecondsDuration.OneWeek,
    label: '1 Week',
  },
]

/**
 * Enforces certain actions to require extra authentication,
 * like viewing a protected note, as well as managing how long that
 * authentication should be valid for.
 */
export class SNProtectionService extends AbstractService<ProtectionEvent> implements ProtectionsClientInterface {
  private sessionExpiryTimeout = -1
  private mobilePasscodeTiming: MobileUnlockTiming | undefined = MobileUnlockTiming.OnQuit
  private mobileBiometricsTiming: MobileUnlockTiming | undefined = MobileUnlockTiming.OnQuit

  constructor(
    private encryptionService: EncryptionService,
    private mutator: MutatorClientInterface,
    private challengeService: ChallengeService,
    private storageService: DiskStorageService,
    protected override internalEventBus: InternalEventBusInterface,
  ) {
    super(internalEventBus)
  }

  public override deinit(): void {
    clearTimeout(this.sessionExpiryTimeout)
    ;(this.encryptionService as unknown) = undefined
    ;(this.challengeService as unknown) = undefined
    ;(this.storageService as unknown) = undefined
    super.deinit()
  }

  override handleApplicationStage(stage: ApplicationStage): Promise<void> {
    if (stage === ApplicationStage.LoadedDatabase_12) {
      this.updateSessionExpiryTimer(this.getSessionExpiryDate())
      this.mobilePasscodeTiming = this.getMobilePasscodeTiming()
      this.mobileBiometricsTiming = this.getMobileBiometricsTiming()
    }
    return Promise.resolve()
  }

  public hasProtectionSources(): boolean {
    return this.encryptionService.hasAccount() || this.encryptionService.hasPasscode() || this.hasBiometricsEnabled()
  }

  public hasUnprotectedAccessSession(): boolean {
    if (!this.hasProtectionSources()) {
      return true
    }
    return this.getSessionExpiryDate() > new Date()
  }

  public hasBiometricsEnabled(): boolean {
    const biometricsState = this.storageService.getValue(StorageKey.BiometricsState, StorageValueModes.Nonwrapped)
    return Boolean(biometricsState)
  }

  public enableBiometrics(): boolean {
    if (this.hasBiometricsEnabled()) {
      SNLog.onError(Error('Tried to enable biometrics when they already are enabled.'))
      return false
    }

    this.storageService.setValue(StorageKey.BiometricsState, true, StorageValueModes.Nonwrapped)

    return true
  }

  public async disableBiometrics(): Promise<boolean> {
    if (!this.hasBiometricsEnabled()) {
      SNLog.onError(Error('Tried to disable biometrics when they already are disabled.'))
      return false
    }

    if (await this.validateOrRenewSession(ChallengeReason.DisableBiometrics)) {
      this.storageService.setValue(StorageKey.BiometricsState, false, StorageValueModes.Nonwrapped)
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
    if (this.encryptionService.hasPasscode()) {
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
    return this.storageService.getValue<MobileUnlockTiming | undefined>(
      StorageKey.MobileBiometricsTiming,
      StorageValueModes.Nonwrapped,
      MobileUnlockTiming.OnQuit,
    )
  }

  getMobilePasscodeTiming(): MobileUnlockTiming | undefined {
    return this.storageService.getValue<MobileUnlockTiming | undefined>(
      StorageKey.MobilePasscodeTiming,
      StorageValueModes.Nonwrapped,
      MobileUnlockTiming.OnQuit,
    )
  }

  setMobileBiometricsTiming(timing: MobileUnlockTiming): void {
    this.storageService.setValue(StorageKey.MobileBiometricsTiming, timing, StorageValueModes.Nonwrapped)
    this.mobileBiometricsTiming = timing
  }

  setMobilePasscodeTiming(timing: MobileUnlockTiming): void {
    this.storageService.setValue(StorageKey.MobilePasscodeTiming, timing, StorageValueModes.Nonwrapped)
    this.mobilePasscodeTiming = timing
  }

  setMobileScreenshotPrivacyEnabled(isEnabled: boolean) {
    return this.storageService.setValue(StorageKey.MobileScreenshotPrivacyEnabled, isEnabled, StorageValueModes.Default)
  }

  getMobileScreenshotPrivacyEnabled(): boolean {
    return this.storageService.getValue(StorageKey.MobileScreenshotPrivacyEnabled, StorageValueModes.Default, false)
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

    if (this.encryptionService.hasPasscode()) {
      prompts.push(new ChallengePrompt(ChallengeValidation.LocalPasscode))
    }

    if (requireAccountPassword) {
      if (!this.encryptionService.hasAccount()) {
        throw Error('Requiring account password for challenge with no account')
      }
      prompts.push(new ChallengePrompt(ChallengeValidation.AccountPassword))
    }

    if (prompts.length === 0) {
      if (fallBackToAccountPassword && this.encryptionService.hasAccount()) {
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

    const response = await this.challengeService.promptForChallengeResponse(new Challenge(prompts, reason, true))

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
    const expiresAt = this.storageService.getValue<number>(StorageKey.ProtectionExpirey)
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
    this.storageService.setValue(StorageKey.ProtectionExpirey, date)
  }

  private getLastSessionLength(): UnprotectedAccessSecondsDuration | undefined {
    return this.storageService.getValue(StorageKey.ProtectionSessionLength)
  }

  private setSessionLength(length: UnprotectedAccessSecondsDuration): void {
    this.storageService.setValue(StorageKey.ProtectionSessionLength, length)
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
