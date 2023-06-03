import { ProtocolVersion } from '@standardnotes/common'
import { ItemContent } from '../../Abstract/Content/ItemContent'
import { KeySystemIdentifier } from './KeySystemIdentifier'

export type KeySystemRootKeyContentSpecialized = {
  systemIdentifier: KeySystemIdentifier
  systemName: string
  systemDescription?: string

  key: string
  keyTimestamp: number
  keyVersion: ProtocolVersion
}

export type KeySystemRootKeyContent = KeySystemRootKeyContentSpecialized & ItemContent
