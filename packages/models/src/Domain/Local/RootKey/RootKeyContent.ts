import { PkcKeyPair } from '@standardnotes/sncrypto-common'
import { ItemContent } from '../../Abstract/Content/ItemContent'
import { ProtocolVersion, AnyKeyParamsContent } from '@standardnotes/common'

export interface RootKeyContentSpecialized {
  version: ProtocolVersion
  masterKey: string
  serverPassword?: string
  dataAuthenticationKey?: string
  keyParams: AnyKeyParamsContent

  encryptionKeyPair?: PkcKeyPair
  signingKeyPair?: PkcKeyPair
}

export type RootKeyContent = RootKeyContentSpecialized & ItemContent
