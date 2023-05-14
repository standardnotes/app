import { ProtocolVersion } from '@standardnotes/common'
import { DecryptedItemInterface } from './../../Abstract/Item/Interfaces/DecryptedItem'
import { ShareGroupKeyContent } from './ShareGroupKeyContent'
import { ShareGroupKeyPermission } from './ShareGroupKeyPermission'

export interface ShareGroupKeyInterface extends DecryptedItemInterface<ShareGroupKeyContent> {
  readonly privateKey: string
  readonly publicKey: string
  readonly apiToken: string
  readonly groupKey: string
  readonly isUserOriginator: boolean
  readonly permissions: ShareGroupKeyPermission
  get itemsKey(): string
  get keyVersion(): ProtocolVersion
}
