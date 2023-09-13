import { KeySystemIdentifier } from '../../Syncable/KeySystemRootKey/KeySystemIdentifier'

export type ExclusionaryOptions = { exclude: KeySystemIdentifier[]; locked: KeySystemIdentifier[] }
export type ExclusiveOptions = { exclusive: KeySystemIdentifier }

export function isExclusionaryOptionsValue(
  options: ExclusionaryOptions | ExclusiveOptions,
): options is ExclusionaryOptions {
  return 'exclude' in options || 'locked' in options
}

export type VaultDisplayOptionsPersistable = ExclusionaryOptions | ExclusiveOptions
