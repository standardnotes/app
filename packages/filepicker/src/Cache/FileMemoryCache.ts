import { removeFromArray } from '@standardnotes/utils'
import { Uuid } from '@standardnotes/common'
import { EncryptedBytes } from '@standardnotes/files'

export class FileMemoryCache {
  private cache: Record<Uuid, EncryptedBytes> = {}
  private orderedQueue: Uuid[] = []

  constructor(public readonly maxSize: number) {}

  add(uuid: Uuid, data: EncryptedBytes): boolean {
    if (data.encryptedBytes.length > this.maxSize) {
      return false
    }

    while (this.size + data.encryptedBytes.length > this.maxSize) {
      this.remove(this.orderedQueue[0])
    }

    this.cache[uuid] = data

    this.orderedQueue.push(uuid)

    return true
  }

  get size(): number {
    return Object.values(this.cache)
      .map((bytes) => bytes.encryptedBytes.length)
      .reduce((total, fileLength) => total + fileLength, 0)
  }

  get(uuid: Uuid): EncryptedBytes | undefined {
    return this.cache[uuid]
  }

  remove(uuid: Uuid): void {
    delete this.cache[uuid]

    removeFromArray(this.orderedQueue, uuid)
  }

  clear(): void {
    this.cache = {}

    this.orderedQueue = []
  }
}
