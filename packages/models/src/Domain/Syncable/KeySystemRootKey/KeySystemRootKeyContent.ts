import { ProtocolVersion } from '@standardnotes/common'
import { ItemContent } from '../../Abstract/Content/ItemContent'
import { KeySystemIdentifier } from './KeySystemIdentifier'
import { KeySystemRootKeyParamsInterface } from '../../Local/KeyParams/KeySystemRootKeyParamsInterface'

export type KeySystemRootKeyContentSpecialized = {
  keyParams: KeySystemRootKeyParamsInterface
  systemIdentifier: KeySystemIdentifier
  systemName: string
  systemDescription?: string

  key: string
  keyVersion: ProtocolVersion
  itemsKeyAnchor: string
}

export type KeySystemRootKeyContent = KeySystemRootKeyContentSpecialized & ItemContent
