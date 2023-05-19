import { DecryptedItemInterface } from '../../Abstract/Item/Interfaces/DecryptedItem'
import { KeypairArchiveContent } from './KeypairArchiveContent'

export interface KeypairArchiveInterface extends DecryptedItemInterface<KeypairArchiveContent> {
  readonly publicKey: string
  readonly privateKey: string
}
