import { ContentType } from '@standardnotes/common'

export type DatabaseLoadChunk = {
  keys: string[]
}

export type DatabaseLoadChunkResponse = {
  itemsKeys: DatabaseLoadChunk
  remainingChunks: DatabaseLoadChunk[]
  remainingChunksItemCount: number
}

export type DatabaseLoadOptions = {
  contentTypePriority: ContentType[]
  uuidPriority: string[]
  batchSize: number
}
