import { ApplicationEvent, InternalEventBusInterface, StorageKey } from '@standardnotes/services'
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

    makeObservable(this, {
      options: observable,

      isVaultExplicitelyExcluded: observable,
      isVaultExclusivelyShown: observable,

      hideVault: action,
      unhideVault: action,
      showOnlyVault: action,
      setVaultSelectionOptions: action,
    })
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

  unhideVault = (vault: VaultListingInterface) => {
    const newOptions = this.options.newOptionsByUnexcludingVault(vault)
    this.setVaultSelectionOptions(newOptions)
  }

  showOnlyVault = (vault: VaultListingInterface) => {
    const newOptions = new VaultDisplayOptions({ exclusive: vault })
    this.setVaultSelectionOptions(newOptions)
  }

  setVaultSelectionOptions = (options: VaultDisplayOptions) => {
    this.options = options
    this.application.items.setVaultDisplayOptions(options)

    void this.notifyEvent(VaultDisplayServiceEvent.VaultDisplayOptionsChanged, options)

    this.application.setValue(StorageKey.VaultSelectionOptions, options.getPersistableValue())
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
    const options = VaultDisplayOptions.FromPersistableValue(raw, vaults)

    this.options = options
    void this.notifyEvent(VaultDisplayServiceEvent.VaultDisplayOptionsChanged, options)
  }
}
