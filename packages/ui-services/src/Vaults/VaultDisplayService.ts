import {
  ApplicationEvent,
  Challenge,
  ChallengePrompt,
  ChallengeReason,
  ChallengeStrings,
  ChallengeValidation,
  InternalEventBusInterface,
  StorageKey,
} from '@standardnotes/services'
import { VaultDisplayOptions, VaultDisplayOptionsPersistable, VaultListingInterface } from '@standardnotes/models'
import { ContentType } from '@standardnotes/common'
import { VaultDisplayServiceEvent } from './VaultDisplayServiceEvent'
import { AbstractUIServicee } from '../Abstract/AbstractUIService'
import { WebApplicationInterface } from '../WebApplication/WebApplicationInterface'
import { VaultDisplayServiceInterface } from './VaultDisplayServiceInterface'
import { action, makeObservable, observable } from 'mobx'

export class VaultDisplayService
  extends AbstractUIServicee<VaultDisplayServiceEvent>
  implements VaultDisplayServiceInterface
{
  options: VaultDisplayOptions

  constructor(application: WebApplicationInterface, internalEventBus: InternalEventBusInterface) {
    super(application, internalEventBus)
    this.options = new VaultDisplayOptions({ exclude: [] })
    this.eventDisposers.push(
      application.streamItems<VaultListingInterface>(ContentType.VaultListing, () => {
        this.handleVaultListingStreamUpdate()
      }),
    )

    makeObservable(this, {
      options: observable,

      isVaultExplicitelyExcluded: observable,
      isVaultExclusivelyShown: observable,

      hideVault: action,
      unhideVault: action,
      showOnlyVault: action,
    })
  }

  private handleVaultListingStreamUpdate(): void {
    const vaults = this.application.items.getItems<VaultListingInterface>(ContentType.VaultListing)
    const lockedVaults = vaults.filter((vault) => this.application.vaults.isVaultLocked(vault))

    const options = this.options.newOptionsByExcludingVaults(lockedVaults)
    this.setVaultSelectionOptions(options)
  }

  public getOptions(): VaultDisplayOptions {
    return this.options
  }

  override async onAppEvent(event: ApplicationEvent): Promise<void> {
    if (event === ApplicationEvent.StorageReady) {
      void this.loadVaultSelectionOptionsFromDisk()
    }
  }

  isVaultExplicitelyExcluded = (vault: VaultListingInterface): boolean => {
    return this.options.isVaultExplicitelyExcluded(vault) ?? false
  }

  isVaultExclusivelyShown = (vault: VaultListingInterface): boolean => {
    return this.options.exclusive?.uuid === vault.uuid
  }

  hideVault = (vault: VaultListingInterface) => {
    const newOptions = this.options.newOptionsByExcludingVault(vault)
    this.setVaultSelectionOptions(newOptions)
  }

  unhideVault = async (vault: VaultListingInterface) => {
    if (this.application.vaults.isVaultLocked(vault)) {
      const unlocked = await this.unlockVault(vault)
      if (!unlocked) {
        return
      }
    }

    const newOptions = this.options.newOptionsByUnexcludingVault(vault)
    this.setVaultSelectionOptions(newOptions)
  }

  showOnlyVault = async (vault: VaultListingInterface) => {
    if (this.application.vaults.isVaultLocked(vault)) {
      const unlocked = await this.unlockVault(vault)
      if (!unlocked) {
        return
      }
    }

    const newOptions = new VaultDisplayOptions({ exclusive: vault })
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

    this.application.items.setVaultDisplayOptions(options)

    void this.notifyEvent(VaultDisplayServiceEvent.VaultDisplayOptionsChanged, options)

    if (this.application.isLaunched()) {
      this.application.setValue(StorageKey.VaultSelectionOptions, options.getPersistableValue())
    }
  }

  private loadVaultSelectionOptionsFromDisk = (): void => {
    if (!this.application.isLaunched()) {
      return
    }

    const raw = this.application.getValue<VaultDisplayOptionsPersistable>(StorageKey.VaultSelectionOptions)
    if (!raw) {
      return
    }

    const vaults = this.application.items.getItems<VaultListingInterface>(ContentType.VaultListing)
    let options = VaultDisplayOptions.FromPersistableValue(raw, vaults)

    const lockedVaults = vaults.filter((vault) => this.application.vaults.isVaultLocked(vault))
    options = options.newOptionsByExcludingVaults(lockedVaults)

    this.options = options
    void this.notifyEvent(VaultDisplayServiceEvent.VaultDisplayOptionsChanged, options)
  }
}
