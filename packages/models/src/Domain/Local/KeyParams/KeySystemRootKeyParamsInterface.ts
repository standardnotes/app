import { ProtocolVersion } from '@standardnotes/common'
import { KeySystemIdentifier } from '../../Syncable/KeySystemRootKey/KeySystemIdentifier'

export enum KeySystemRootKeyPasswordType {
  UserInputted = 'user_inputted',
  Randomized = 'randomized',
}

/**
 * Key params are public data that contain information about how a root key was created.
 * Given a keyParams object and a password, clients can compute a root key that was created
 * previously.
 */
export interface KeySystemRootKeyParamsInterface {
  systemIdentifier: KeySystemIdentifier
  seed: string
  version: ProtocolVersion
  passwordType: KeySystemRootKeyPasswordType
  creationTimestamp: number
}
