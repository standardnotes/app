import { ContentType } from '@standardnotes/domain-core'
import { DecryptedItem } from '../../Abstract/Item/Implementations/DecryptedItem'
import { ItemContent } from '../../Abstract/Content/ItemContent'
import { DecryptedPayloadInterface } from '../../Abstract/Payload/Interfaces/DecryptedPayload'
import { FileMetadata } from './FileMetadata'
import { FileProtocolV1 } from './FileProtocolV1'
import { SortableItem } from '../../Runtime/Collection/CollectionSort'
import { ConflictStrategy, ItemInterface } from '../../Abstract/Item'

type EncryptedBytesLength = number
type DecryptedBytesLength = number

interface SizesDeprecatedDueToAmbiguousNaming {
  size?: DecryptedBytesLength
  chunkSizes?: EncryptedBytesLength[]
}

interface Sizes {
  decryptedSize: DecryptedBytesLength
  encryptedChunkSizes: EncryptedBytesLength[]
}

interface FileContentWithoutSize {
  remoteIdentifier: string
  name: string
  key: string
  encryptionHeader: string
  mimeType: string
}

export type FileContentSpecialized = FileContentWithoutSize & FileMetadata & SizesDeprecatedDueToAmbiguousNaming & Sizes

export type FileContent = FileContentSpecialized & ItemContent

export const isFile = (x: ItemInterface): x is FileItem => x.content_type === ContentType.TYPES.File

export class FileItem
  extends DecryptedItem<FileContent>
  implements FileContentWithoutSize, Sizes, FileProtocolV1, FileMetadata, SortableItem
{
  public readonly remoteIdentifier: string
  public readonly name: string
  public readonly key: string
  public readonly encryptionHeader: string
  public readonly mimeType: string

  public readonly decryptedSize: DecryptedBytesLength
  public readonly encryptedChunkSizes: EncryptedBytesLength[]

  constructor(payload: DecryptedPayloadInterface<FileContent>) {
    super(payload)
    this.remoteIdentifier = this.content.remoteIdentifier
    this.name = this.content.name
    this.key = this.content.key

    if (this.content.size && this.content.chunkSizes) {
      this.decryptedSize = this.content.size
      this.encryptedChunkSizes = this.content.chunkSizes
    } else {
      this.decryptedSize = this.content.decryptedSize
      this.encryptedChunkSizes = this.content.encryptedChunkSizes
    }

    this.encryptionHeader = this.content.encryptionHeader
    this.mimeType = this.content.mimeType
  }

  public override strategyWhenConflictingWithItem(item: FileItem): ConflictStrategy {
    if (
      item.key !== this.key ||
      item.encryptionHeader !== this.encryptionHeader ||
      item.remoteIdentifier !== this.remoteIdentifier ||
      JSON.stringify(item.encryptedChunkSizes) !== JSON.stringify(this.encryptedChunkSizes)
    ) {
      return ConflictStrategy.KeepBaseDuplicateApply
    }

    return ConflictStrategy.KeepBase
  }

  public get encryptedSize(): number {
    return this.encryptedChunkSizes.reduce((total, chunk) => total + chunk, 0)
  }

  public get title(): string {
    return this.name
  }
}
