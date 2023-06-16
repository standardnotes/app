import { ProtocolVersion } from '@standardnotes/common'
import { ItemContent } from '../../Abstract/Content/ItemContent'
import { KeySystemIdentifier } from './KeySystemIdentifier'
import { KeySystemRootKeyParamsInterface } from '../../Local/KeyParams/KeySystemRootKeyParamsInterface'

export type KeySystemRootKeyContentSpecialized = {
  keyParams: KeySystemRootKeyParamsInterface
  systemIdentifier: KeySystemIdentifier

  key: string
  keyVersion: ProtocolVersion

  token: string
}

export type KeySystemRootKeyContent = KeySystemRootKeyContentSpecialized & ItemContent
