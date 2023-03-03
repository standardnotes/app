import {
  AnyKeyParamsContent,
  KeyParamsContent001,
  KeyParamsContent002,
  KeyParamsContent003,
  KeyParamsContent004,
} from '@standardnotes/common'
import { KeyParamsResponse } from '@standardnotes/responses'
import { ProtocolVersionForKeyParams } from './ProtocolVersionForKeyParams'
import { SNRootKeyParams } from './RootKeyParams'

/**
 *  001, 002:
 *  - Nonce is not uploaded to server, instead used to compute salt locally and send to server
 *  - Salt is returned from server
 *  - Cost/iteration count is returned from the server
 *  - Account identifier is returned as 'email'
 *  003, 004:
 *  - Salt is computed locally via the seed (pw_nonce) returned from the server
 *  - Cost/iteration count is determined locally by the protocol version
 *  - Account identifier is returned as 'identifier'
 */

export type AllKeyParamsContents = KeyParamsContent001 & KeyParamsContent002 & KeyParamsContent003 & KeyParamsContent004

export function Create001KeyParams(keyParams: KeyParamsContent001) {
  return CreateAnyKeyParams(keyParams)
}

export function Create002KeyParams(keyParams: KeyParamsContent002) {
  return CreateAnyKeyParams(keyParams)
}

export function Create003KeyParams(keyParams: KeyParamsContent003) {
  return CreateAnyKeyParams(keyParams)
}

export function Create004KeyParams(keyParams: KeyParamsContent004) {
  return CreateAnyKeyParams(keyParams)
}

export function CreateAnyKeyParams(keyParams: AnyKeyParamsContent) {
  if ('content' in keyParams) {
    throw Error('Raw key params shouldnt have content; perhaps you passed in a SNRootKeyParams object.')
  }
  return new SNRootKeyParams(keyParams)
}

export function KeyParamsFromApiResponse(response: KeyParamsResponse, identifier?: string) {
  const rawKeyParams: AnyKeyParamsContent = {
    identifier: identifier || response.identifier!,
    pw_cost: response.pw_cost!,
    pw_nonce: response.pw_nonce!,
    pw_salt: response.pw_salt!,
    version: ProtocolVersionForKeyParams(response),
    origination: response.origination,
    created: response.created,
  }
  return CreateAnyKeyParams(rawKeyParams)
}
