import {
  ApplicationEvent,
  ApplicationStage,
  ApplicationStageChangedEventPayload,
  Challenge,
  ChallengePrompt,
  ChallengeReason,
  ChallengeStrings,
  ChallengeValidation,
  InternalEventBusInterface,
  InternalEventHandlerInterface,
  InternalEventInterface,
  StorageKey,
  VaultLockServiceEvent,
} from '@standardnotes/services'
import {
  DecryptedItemInterface,
  ExclusionaryOptions,
  VaultDisplayOptions,
  VaultDisplayOptionsPersistable,
  VaultListingInterface,
} from '@standardnotes/models'
import { VaultDisplayServiceEvent } from './VaultDisplayServiceEvent'
import { AbstractUIService } from '../Abstract/AbstractUIService'
import { WebApplicationInterface } from '../WebApplication/WebApplicationInterface'
import { VaultDisplayServiceInterface } from './VaultDisplayServiceInterface'
import { action, makeObservable, observable } from 'mobx'
import { ContentType } from '@standardnotes/domain-core'

export class VaultDisplayService
  extends AbstractUIService<VaultDisplayServiceEvent>
  implements VaultDisplayServiceInterface, InternalEventHandlerInterface
{
  previousMultipleSelectionOptions?: VaultDisplayOptions
  options: VaultDisplayOptions

  public exclusivelyShownVault: VaultListingInterface | undefined = undefined

  constructor(application: WebApplicationInterface, internalEventBus: InternalEventBusInterface) {
    super(application, internalEventBus)

    this.options = new VaultDisplayOptions({ exclude: [], locked: [] })

    makeObservable(this, {
      options: observable,

      isVaultExplicitlyExcluded: observable,
      isVaultExclusivelyShown: observable,
      exclusivelyShownVault: observable,

      hideVault: action,
      unhideVault: action,
      showOnlyVault: action,
    })

    internalEventBus.addEventHandler(this, VaultLockServiceEvent.VaultLocked)
    internalEventBus.addEventHandler(this, VaultLockServiceEvent.VaultUnlocked)
    internalEventBus.addEventHandler(this, ApplicationEvent.ApplicationStageChanged)

    this.addObserver(
      application.items.streamItems(ContentType.TYPES.VaultListing, ({ removed }) => {
        if (removed.some((vault) => vault.uuid === this.exclusivelyShownVault?.uuid)) {
          this.changeToMultipleVaultDisplayMode()
        }
      }),
    )
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    if (event.type === VaultLockServiceEvent.VaultLocked || event.type === VaultLockServiceEvent.VaultUnlocked) {
      this.handleVaultLockingStatusChanged()
    } else if (event.type === ApplicationEvent.ApplicationStageChanged) {
      const stage = (event.payload as ApplicationStageChangedEventPayload).stage
      if (stage === ApplicationStage.StorageDecrypted_09) {
        void this.loadVaultSelectionOptionsFromDisk()
      }
    }
  }

  private handleVaultLockingStatusChanged(): void {
    const lockedVaults = this.application.vaultLocks.getLockedvaults()

    const options = this.options.newOptionsByIntakingLockedVaults(lockedVaults)
    this.setVaultSelectionOptions(options)
  }

  public getOptions(): VaultDisplayOptions {
    return this.options
  }

  isVaultExplicitlyExcluded = (vault: VaultListingInterface): boolean => {
    return this.options.isVaultExplicitlyExcluded(vault) ?? false
  }

  isVaultDisabledOrLocked(vault: VaultListingInterface): boolean {
    return this.options.isVaultDisabledOrLocked(vault)
  }

  isVaultExclusivelyShown = (vault: VaultListingInterface): boolean => {
    return this.options.isVaultExclusivelyShown(vault)
  }

  isInExclusiveDisplayMode(): boolean {
    return this.options.isInExclusiveDisplayMode()
  }

  getItemVault(item: DecryptedItemInterface): VaultListingInterface | undefined {
    if (this.application.items.isTemplateItem(item)) {
      if (this.exclusivelyShownVault) {
        return this.exclusivelyShownVault
      }

      return undefined
    }

    const vault = this.application.vaults.getItemVault(item)
    return vault
  }

  changeToMultipleVaultDisplayMode(): void {
    const vaults = this.application.vaults.getVaults()
    const lockedVaults = this.application.vaultLocks.getLockedvaults()

    const exclude = this.previousMultipleSelectionOptions
      ? (this.previousMultipleSelectionOptions.getOptions() as ExclusionaryOptions).exclude
      : vaults
          .map((vault) => vault.systemIdentifier)
          .filter((identifier) => identifier !== this.exclusivelyShownVault?.systemIdentifier)

    const newOptions = new VaultDisplayOptions({
      exclude,
      locked: lockedVaults.map((vault) => vault.systemIdentifier),
    })

    this.setVaultSelectionOptions(newOptions)
  }

  hideVault = (vault: VaultListingInterface) => {
    const lockedVaults = this.application.vaultLocks.getLockedvaults()
    const newOptions = this.options.newOptionsByExcludingVault(vault, lockedVaults)
    this.setVaultSelectionOptions(newOptions)
  }

  unhideVault = async (vault: VaultListingInterface) => {
    if (this.application.vaultLocks.isVaultLocked(vault)) {
      const unlocked = await this.unlockVault(vault)
      if (!unlocked) {
        return
      }
    }

    const lockedVaults = this.application.vaultLocks.getLockedvaults()
    const newOptions = this.options.newOptionsByUnexcludingVault(vault, lockedVaults)
    this.setVaultSelectionOptions(newOptions)
  }

  showOnlyVault = async (vault: VaultListingInterface) => {
    if (this.application.vaultLocks.isVaultLocked(vault)) {
      const unlocked = await this.unlockVault(vault)
      if (!unlocked) {
        return
      }
    }

    const newOptions = new VaultDisplayOptions({ exclusive: vault.systemIdentifier })
    this.setVaultSelectionOptions(newOptions)
  }

  async unlockVault(vault: VaultListingInterface): Promise<boolean> {
    if (!this.application.vaultLocks.isVaultLocked(vault)) {
      throw new Error('Attempting to unlock a vault that is not locked.')
    }

    const challenge = new Challenge(
      [new ChallengePrompt(ChallengeValidation.None, undefined, 'Password')],
      ChallengeReason.Custom,
      true,
      ChallengeStrings.UnlockVault(vault.name),
      ChallengeStrings.EnterVaultPassword,
    )

    return new Promise((resolve) => {
      this.application.challenges.addChallengeObserver(challenge, {
        onCancel() {
          resolve(false)
        },
        onNonvalidatedSubmit: async (challengeResponse) => {
          const value = challengeResponse.getDefaultValue()
          if (!value) {
            this.application.challenges.completeChallenge(challenge)
            resolve(false)
            return
          }

          const password = value.value as string

          const unlocked = await this.application.vaultLocks.unlockNonPersistentVault(vault, password)
          if (!unlocked) {
            this.application.challenges.setValidationStatusForChallenge(challenge, value, false)
            resolve(false)
            return
          }

          this.application.challenges.completeChallenge(challenge)
          resolve(true)
        },
      })

      void this.application.challenges.promptForChallengeResponse(challenge)
    })
  }

  private setVaultSelectionOptions = (options: VaultDisplayOptions) => {
    const previousOptions = this.options
    this.options = options

    const changingFromMultipleToExclusive =
      !previousOptions.isInExclusiveDisplayMode() && options.isInExclusiveDisplayMode()

    if (changingFromMultipleToExclusive) {
      this.previousMultipleSelectionOptions = previousOptions
    }

    if (this.isInExclusiveDisplayMode()) {
      const vaultOrError = this.application.vaults.getVault({
        keySystemIdentifier: this.options.getExclusivelyShownVault(),
      })
      this.exclusivelyShownVault = vaultOrError.isFailed() ? undefined : vaultOrError.getValue()
    } else {
      this.exclusivelyShownVault = undefined
    }

    this.application.items.setVaultDisplayOptions(options)

    void this.notifyEvent(VaultDisplayServiceEvent.VaultDisplayOptionsChanged, options)

    if (this.application.isLaunched()) {
      this.application.setValue(StorageKey.VaultSelectionOptions, options.getPersistableValue())
    }
  }

  private loadVaultSelectionOptionsFromDisk = (): void => {
    const raw = this.application.getValue<VaultDisplayOptionsPersistable>(StorageKey.VaultSelectionOptions)
    if (!raw) {
      return
    }

    const options = VaultDisplayOptions.FromPersistableValue(raw)

    this.options = options
    void this.notifyEvent(VaultDisplayServiceEvent.VaultDisplayOptionsChanged, options)
  }

  override deinit(): void {
    ;(this.options as unknown) = undefined
    super.deinit()
  }
}
