import { Result } from '@standardnotes/domain-core'
import { ProtocolVersion, ProtocolVersionLength } from './ProtocolVersion'

export function ProtocolVersionFromEncryptedString(string: string): Result<ProtocolVersion> {
  try {
    const version = string.substring(0, ProtocolVersionLength) as ProtocolVersion
    if (Object.values(ProtocolVersion).includes(version)) {
      return Result.ok(version)
    }
  } catch (error) {
    return Result.fail(JSON.stringify(error))
  }

  return Result.fail(`Invalid encrypted string ${string}`)
}
