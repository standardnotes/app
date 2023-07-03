import { VaultListingInterface } from '../../Syncable/VaultListing/VaultListingInterface'
import { uniqueArray } from '@standardnotes/utils'
import {
  ExclusioanaryOptions,
  ExclusiveOptions,
  VaultDisplayOptionsPersistable,
  isExclusioanaryOptionsValue,
} from './VaultDisplayOptionsTypes'
import { KeySystemIdentifier } from '../../Syncable/KeySystemRootKey/KeySystemIdentifier'

function KeySystemIdentifiers(vaults: VaultListingInterface[]): KeySystemIdentifier[] {
  return vaults.map((vault) => vault.systemIdentifier)
}

export class VaultDisplayOptions {
  constructor(private readonly options: ExclusioanaryOptions | ExclusiveOptions) {}

  public getOptions(): ExclusioanaryOptions | ExclusiveOptions {
    return this.options
  }

  public getExclusivelyShownVault(): KeySystemIdentifier {
    if (isExclusioanaryOptionsValue(this.options)) {
      throw new Error('Not in exclusive display mode')
    }

    return this.options.exclusive
  }

  public isInExclusiveDisplayMode(): boolean {
    return !isExclusioanaryOptionsValue(this.options)
  }

  public isVaultExplicitelyExcluded(vault: VaultListingInterface): boolean {
    if (isExclusioanaryOptionsValue(this.options)) {
      return this.options.exclude.some((excludedVault) => excludedVault === vault.systemIdentifier)
    } else if (this.options.exclusive) {
      return this.options.exclusive !== vault.systemIdentifier
    }

    throw new Error('Invalid vault display options')
  }

  isVaultExclusivelyShown(vault: VaultListingInterface): boolean {
    return !isExclusioanaryOptionsValue(this.options) && this.options.exclusive === vault.systemIdentifier
  }

  isVaultDisabledOrLocked(vault: VaultListingInterface): boolean {
    if (isExclusioanaryOptionsValue(this.options)) {
      const matchingLocked = this.options.locked.find((lockedVault) => lockedVault === vault.systemIdentifier)
      if (matchingLocked) {
        return true
      }
    }

    return this.isVaultExplicitelyExcluded(vault)
  }

  getPersistableValue(): VaultDisplayOptionsPersistable {
    return this.options
  }

  newOptionsByIntakingLockedVaults(lockedVaults: VaultListingInterface[]): VaultDisplayOptions {
    if (isExclusioanaryOptionsValue(this.options)) {
      return new VaultDisplayOptions({ exclude: this.options.exclude, locked: KeySystemIdentifiers(lockedVaults) })
    } else {
      return new VaultDisplayOptions({ exclusive: this.options.exclusive })
    }
  }

  newOptionsByExcludingVault(vault: VaultListingInterface, lockedVaults: VaultListingInterface[]): VaultDisplayOptions {
    return this.newOptionsByExcludingVaults([vault], lockedVaults)
  }

  newOptionsByExcludingVaults(
    vaults: VaultListingInterface[],
    lockedVaults: VaultListingInterface[],
  ): VaultDisplayOptions {
    if (isExclusioanaryOptionsValue(this.options)) {
      return new VaultDisplayOptions({
        exclude: uniqueArray([...this.options.exclude, ...KeySystemIdentifiers(vaults)]),
        locked: KeySystemIdentifiers(lockedVaults),
      })
    } else {
      return new VaultDisplayOptions({
        exclude: KeySystemIdentifiers(vaults),
        locked: KeySystemIdentifiers(lockedVaults),
      })
    }
  }

  newOptionsByUnexcludingVault(
    vault: VaultListingInterface,
    lockedVaults: VaultListingInterface[],
  ): VaultDisplayOptions {
    if (isExclusioanaryOptionsValue(this.options)) {
      return new VaultDisplayOptions({
        exclude: this.options.exclude.filter((excludedVault) => excludedVault !== vault.systemIdentifier),
        locked: KeySystemIdentifiers(lockedVaults),
      })
    } else {
      return new VaultDisplayOptions({ exclude: [], locked: KeySystemIdentifiers(lockedVaults) })
    }
  }

  static FromPersistableValue(value: VaultDisplayOptionsPersistable): VaultDisplayOptions {
    return new VaultDisplayOptions(value)
  }
}
