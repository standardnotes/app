import { AsymmetricMessagePayloadType } from '@standardnotes/models'

const TypesUsingReplaceableIdentifiers = [
  AsymmetricMessagePayloadType.SharedVaultRootKeyChanged,
  AsymmetricMessagePayloadType.SharedVaultMetadataChanged,
]

export function GetReplaceabilityIdentifier(
  type: AsymmetricMessagePayloadType,
  sharedVaultUuid: string,
  keySystemIdentifier: string,
): string | undefined {
  if (!TypesUsingReplaceableIdentifiers.includes(type)) {
    return undefined
  }
  return [type, sharedVaultUuid, keySystemIdentifier].join(':')
}
