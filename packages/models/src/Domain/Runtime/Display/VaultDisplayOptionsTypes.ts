import { KeySystemIdentifier } from '../../Syncable/KeySystemRootKey/KeySystemIdentifier'

export type ExclusioanaryOptions = { exclude: KeySystemIdentifier[]; locked: KeySystemIdentifier[] }
export type ExclusiveOptions = { exclusive: KeySystemIdentifier }

export function isExclusioanaryOptionsValue(
  options: ExclusioanaryOptions | ExclusiveOptions,
): options is ExclusioanaryOptions {
  return 'exclude' in options || 'locked' in options
}

export type VaultDisplayOptionsPersistable = ExclusioanaryOptions | ExclusiveOptions
