import { FullyFormedTransferPayload } from '@standardnotes/models'

export type DatabaseKeysLoadChunk = {
  keys: string[]
}

export type DatabaseFullEntryLoadChunk = {
  entries: FullyFormedTransferPayload[]
}

export function isChunkFullEntry(
  x: DatabaseKeysLoadChunk | DatabaseFullEntryLoadChunk,
): x is DatabaseFullEntryLoadChunk {
  return (x as DatabaseFullEntryLoadChunk).entries !== undefined
}

export type DatabaseKeysLoadChunkResponse = {
  keys: {
    itemsKeys: DatabaseKeysLoadChunk
    keySystemRootKeys: DatabaseKeysLoadChunk
    keySystemItemsKeys: DatabaseKeysLoadChunk
    remainingChunks: DatabaseKeysLoadChunk[]
  }
  remainingChunksItemCount: number
}

export type DatabaseFullEntryLoadChunkResponse = {
  fullEntries: {
    itemsKeys: DatabaseFullEntryLoadChunk
    keySystemRootKeys: DatabaseFullEntryLoadChunk
    keySystemItemsKeys: DatabaseFullEntryLoadChunk
    remainingChunks: DatabaseFullEntryLoadChunk[]
  }
  remainingChunksItemCount: number
}

export function isFullEntryLoadChunkResponse(
  x: DatabaseKeysLoadChunkResponse | DatabaseFullEntryLoadChunkResponse,
): x is DatabaseFullEntryLoadChunkResponse {
  return (x as DatabaseFullEntryLoadChunkResponse).fullEntries !== undefined
}

export type DatabaseLoadOptions = {
  contentTypePriority: string[]
  uuidPriority: string[]
  batchSize: number
}
