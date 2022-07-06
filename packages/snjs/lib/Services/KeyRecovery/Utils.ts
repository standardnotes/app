import { leftVersionGreaterThanOrEqualToRight } from '@standardnotes/common'
import { SNRootKeyParams } from '@standardnotes/encryption'

export function serverKeyParamsAreSafe(serverParams: SNRootKeyParams, clientParams: SNRootKeyParams) {
  return leftVersionGreaterThanOrEqualToRight(serverParams.version, clientParams.version)
}
