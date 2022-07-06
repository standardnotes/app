import { KeyParamsOrigination, ProtocolVersion } from '@standardnotes/common'

export type KeyParamsData = {
  identifier?: string
  pw_cost?: number
  pw_nonce?: string
  version?: ProtocolVersion
  /** Legacy V002 */
  pw_salt?: string
  email?: string
  /** Legacy V001 */
  pw_func?: string
  pw_alg?: string
  pw_key_size?: number
  origination?: KeyParamsOrigination
  created?: string
}
