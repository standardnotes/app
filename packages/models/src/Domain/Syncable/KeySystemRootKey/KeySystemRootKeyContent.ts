import { ItemContent } from '../../Abstract/Content/ItemContent'
import { KeySystemIdentifier } from './KeySystemIdentifier'
import { KeySystemRootKeyParamsInterface } from '../../Local/KeyParams/KeySystemRootKeyParamsInterface'
import { ProtocolVersion } from '../../Local/Protocol/ProtocolVersion'

export type KeySystemRootKeyContentSpecialized = {
  keyParams: KeySystemRootKeyParamsInterface
  systemIdentifier: KeySystemIdentifier

  key: string
  keyVersion: ProtocolVersion

  token: string
}

export type KeySystemRootKeyContent = KeySystemRootKeyContentSpecialized & ItemContent
