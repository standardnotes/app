export enum ProtocolVersion {
  V001 = '001',
  V002 = '002',
  V003 = '003',
  V004 = '004',
}

export const ProtocolVersionLatest = ProtocolVersion.V004

/** The last protocol version to not use root-key based items keys */
export const ProtocolVersionLastNonrootItemsKey = ProtocolVersion.V003

export const ProtocolExpirationDates: Partial<Record<ProtocolVersion, number>> = Object.freeze({
  [ProtocolVersion.V001]: Date.parse('2018-01-01'),
  [ProtocolVersion.V002]: Date.parse('2020-01-01'),
})

export function isProtocolVersionExpired(version: ProtocolVersion) {
  const expireDate = ProtocolExpirationDates[version]
  if (!expireDate) {
    return false
  }

  const expired = new Date().getTime() > expireDate
  return expired
}

export const ProtocolVersionLength = 3

/**
 *  -1 if a < b
 *  0 if a == b
 *  1 if a > b
 */
export function compareVersions(a: ProtocolVersion, b: ProtocolVersion): number {
  const aNum = Number(a)
  const bNum = Number(b)
  return aNum - bNum
}

export function leftVersionGreaterThanOrEqualToRight(a: ProtocolVersion, b: ProtocolVersion): boolean {
  return compareVersions(a, b) >= 0
}

export function isVersionLessThanOrEqualTo(input: ProtocolVersion, compareTo: ProtocolVersion): boolean {
  return compareVersions(input, compareTo) <= 0
}
