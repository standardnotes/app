import { ItemContent } from '../../Abstract/Content/ItemContent'

export type KeypairArchiveContentSpecialized = {
  publicKey: string
  privateKey: string
}

export type KeypairArchiveContent = KeypairArchiveContentSpecialized & ItemContent
