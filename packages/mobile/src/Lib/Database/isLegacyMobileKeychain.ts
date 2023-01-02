import { LegacyMobileKeychainStructure, RawKeychainValue } from '@standardnotes/snjs'

export function isLegacyMobileKeychain(
  x: LegacyMobileKeychainStructure | RawKeychainValue,
): x is LegacyMobileKeychainStructure {
  return x.ak != undefined
}
