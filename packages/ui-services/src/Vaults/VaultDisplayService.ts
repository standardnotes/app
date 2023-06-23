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
  VaultServiceEvent,
} from '@standardnotes/services'
import { VaultDisplayOptions, VaultDisplayOptionsPersistable, VaultListingInterface } from '@standardnotes/models'
import { VaultDisplayServiceEvent } from './VaultDisplayServiceEvent'
import { AbstractUIServicee } from '../Abstract/AbstractUIService'
import { WebApplicationInterface } from '../WebApplication/WebApplicationInterface'
import { VaultDisplayServiceInterface } from './VaultDisplayServiceInterface'
import { action, makeObservable, observable } from 'mobx'

export class VaultDisplayService
  extends AbstractUIServicee<VaultDisplayServiceEvent>
  implements VaultDisplayServiceInterface, InternalEventHandlerInterface
{
  options: VaultDisplayOptions

  public exclusivelyShownVault: VaultListingInterface | undefined = undefined

  constructor(application: WebApplicationInterface, internalEventBus: InternalEventBusInterface) {
    super(application, internalEventBus)

    this.options = new VaultDisplayOptions({ exclude: [], locked: [] })

    internalEventBus.addEventHandler(this, VaultServiceEvent.VaultLocked)
    internalEventBus.addEventHandler(this, VaultServiceEvent.VaultUnlocked)
    internalEventBus.addEventHandler(this, ApplicationEvent.ApplicationStageChanged)

    makeObservable(this, {
      options: observable,

      isVaultExplicitelyExcluded: observable,
      isVaultExclusivelyShown: observable,
      exclusivelyShownVault: observable,

      hideVault: action,
      unhideVault: action,
      showOnlyVault: action,
    })
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    if (event.type === VaultServiceEvent.VaultLocked || event.type === VaultServiceEvent.VaultUnlocked) {
      this.handleVaultLockingStatusChanged()
    } else if (event.type === ApplicationEvent.ApplicationStageChanged) {
      const stage = (event.payload as ApplicationStageChangedEventPayload).stage
      if (stage === ApplicationStage.StorageDecrypted_09) {
        void this.loadVaultSelectionOptionsFromDisk()
      }
    }
  }

  private handleVaultLockingStatusChanged(): void {
    const lockedVaults = this.application.vaults.getLockedvaults()

    const options = this.options.newOptionsByIntakingLockedVaults(lockedVaults)
    this.setVaultSelectionOptions(options)
  }

  public getOptions(): VaultDisplayOptions {
    return this.options
  }

  isVaultExplicitelyExcluded = (vault: VaultListingInterface): boolean => {
    return this.options.isVaultExplicitelyExcluded(vault) ?? false
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

  changeToMultipleVaultDisplayMode(): void {
    const vaults = this.application.vaults.getVaults()
    const lockedVaults = this.application.vaults.getLockedvaults()

    const newOptions = new VaultDisplayOptions({
      exclude: vaults
        .map((vault) => vault.systemIdentifier)
        .filter((identifier) => identifier !== this.exclusivelyShownVault?.systemIdentifier),
      locked: lockedVaults.map((vault) => vault.systemIdentifier),
    })

    this.setVaultSelectionOptions(newOptions)
  }

  hideVault = (vault: VaultListingInterface) => {
    const lockedVaults = this.application.vaults.getLockedvaults()
    const newOptions = this.options.newOptionsByExcludingVault(vault, lockedVaults)
    this.setVaultSelectionOptions(newOptions)
  }

  unhideVault = async (vault: VaultListingInterface) => {
    if (this.application.vaults.isVaultLocked(vault)) {
      const unlocked = await this.unlockVault(vault)
      if (!unlocked) {
        return
      }
    }

    const lockedVaults = this.application.vaults.getLockedvaults()
    const newOptions = this.options.newOptionsByUnexcludingVault(vault, lockedVaults)
    this.setVaultSelectionOptions(newOptions)
  }

  showOnlyVault = async (vault: VaultListingInterface) => {
    if (this.application.vaults.isVaultLocked(vault)) {
      const unlocked = await this.unlockVault(vault)
      if (!unlocked) {
        return
      }
    }

    const newOptions = new VaultDisplayOptions({ exclusive: vault.systemIdentifier })
    this.setVaultSelectionOptions(newOptions)
  }

  async unlockVault(vault: VaultListingInterface): Promise<boolean> {
    if (!this.application.vaults.isVaultLocked(vault)) {
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

          const unlocked = await this.application.vaults.unlockNonPersistentVault(vault, password)
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
    this.options = options

    if (this.isInExclusiveDisplayMode()) {
      this.exclusivelyShownVault = this.application.vaults.getVault(this.options.getExclusivelyShownVault())
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
