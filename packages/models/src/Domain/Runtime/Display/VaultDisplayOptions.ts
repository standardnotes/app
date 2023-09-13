import { VaultListingInterface } from '../../Syncable/VaultListing/VaultListingInterface'
import { uniqueArray } from '@standardnotes/utils'
import {
  ExclusionaryOptions,
  ExclusiveOptions,
  VaultDisplayOptionsPersistable,
  isExclusionaryOptionsValue,
} from './VaultDisplayOptionsTypes'
import { KeySystemIdentifier } from '../../Syncable/KeySystemRootKey/KeySystemIdentifier'

function KeySystemIdentifiers(vaults: VaultListingInterface[]): KeySystemIdentifier[] {
  return vaults.map((vault) => vault.systemIdentifier)
}

export class VaultDisplayOptions {
  constructor(private readonly options: ExclusionaryOptions | ExclusiveOptions) {}

  public getOptions(): ExclusionaryOptions | ExclusiveOptions {
    return this.options
  }

  public getExclusivelyShownVault(): KeySystemIdentifier {
    if (isExclusionaryOptionsValue(this.options)) {
      throw new Error('Not in exclusive display mode')
    }

    return this.options.exclusive
  }

  public isInExclusiveDisplayMode(): boolean {
    return !isExclusionaryOptionsValue(this.options)
  }

  public isVaultExplicitlyExcluded(vault: VaultListingInterface): boolean {
    if (isExclusionaryOptionsValue(this.options)) {
      return this.options.exclude.some((excludedVault) => excludedVault === vault.systemIdentifier)
    } else if (this.options.exclusive) {
      return this.options.exclusive !== vault.systemIdentifier
    }

    throw new Error('Invalid vault display options')
  }

  isVaultExclusivelyShown(vault: VaultListingInterface): boolean {
    return !isExclusionaryOptionsValue(this.options) && this.options.exclusive === vault.systemIdentifier
  }

  isVaultDisabledOrLocked(vault: VaultListingInterface): boolean {
    if (isExclusionaryOptionsValue(this.options)) {
      const matchingLocked = this.options.locked.find((lockedVault) => lockedVault === vault.systemIdentifier)
      if (matchingLocked) {
        return true
      }
    }

    return this.isVaultExplicitlyExcluded(vault)
  }

  getPersistableValue(): VaultDisplayOptionsPersistable {
    return this.options
  }

  newOptionsByIntakingLockedVaults(lockedVaults: VaultListingInterface[]): VaultDisplayOptions {
    if (isExclusionaryOptionsValue(this.options)) {
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
    if (isExclusionaryOptionsValue(this.options)) {
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
    if (isExclusionaryOptionsValue(this.options)) {
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
