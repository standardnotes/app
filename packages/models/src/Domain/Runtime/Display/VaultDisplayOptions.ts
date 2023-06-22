import { VaultListingInterface } from '../../Syncable/VaultListing/VaultListingInterface'
import { isNotUndefined } from '@standardnotes/utils'

export type VaultDisplayOptionsPersistable = { exclude: string[] } | { exclusive: string }

export class VaultDisplayOptions {
  public readonly exclude?: VaultListingInterface[]
  public readonly exclusive?: VaultListingInterface

  constructor(options: { exclude: VaultListingInterface[] } | { exclusive: VaultListingInterface }) {
    if ('exclude' in options) {
      this.exclude = options.exclude
    } else {
      this.exclusive = options.exclusive
    }
  }

  public isVaultExplicitelyExcluded(vault: VaultListingInterface): boolean {
    if (this.exclude) {
      return this.exclude.some((excludedVault) => excludedVault.uuid === vault.uuid)
    } else if (this.exclusive) {
      return this.exclusive.uuid !== vault.uuid
    }

    throw new Error('Invalid vault display options')
  }

  getPersistableValue(): VaultDisplayOptionsPersistable {
    if (this.exclude) {
      return { exclude: this.exclude.map((vault) => vault.uuid) }
    } else if (this.exclusive) {
      return { exclusive: this.exclusive.uuid }
    }

    throw new Error('Invalid vault display options')
  }

  newOptionsByExcludingVault(vault: VaultListingInterface): VaultDisplayOptions {
    return this.newOptionsByExcludingVaults([vault])
  }

  newOptionsByExcludingVaults(vaults: VaultListingInterface[]): VaultDisplayOptions {
    if (this.exclude) {
      return new VaultDisplayOptions({ exclude: [...this.exclude, ...vaults] })
    } else if (this.exclusive) {
      return new VaultDisplayOptions({ exclude: vaults })
    }

    throw new Error('Invalid vault display options')
  }

  newOptionsByUnexcludingVault(vault: VaultListingInterface): VaultDisplayOptions {
    if (this.exclude) {
      return new VaultDisplayOptions({
        exclude: this.exclude.filter((excludedVault) => excludedVault.uuid !== vault.uuid),
      })
    } else if (this.exclusive) {
      return new VaultDisplayOptions({ exclude: [] })
    }

    throw new Error('Invalid vault display options')
  }

  static FromPersistableValue(
    value: VaultDisplayOptionsPersistable,
    vaults: VaultListingInterface[],
  ): VaultDisplayOptions {
    if ('exclude' in value) {
      const exclude = value.exclude.map((uuid) => vaults.find((vault) => vault.uuid === uuid)).filter(isNotUndefined)
      return new VaultDisplayOptions({ exclude })
    } else if ('exclusive' in value) {
      const exclusive = vaults.find((vault) => vault.uuid === value.exclusive)
      if (!exclusive) {
        throw new Error('Invalid vault display options')
      }
      return new VaultDisplayOptions({ exclusive })
    }

    throw new Error('Invalid vault display options')
  }
}
