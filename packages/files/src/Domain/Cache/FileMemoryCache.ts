import { removeFromArray } from '@standardnotes/utils'

import { EncryptedBytes } from '../Types/EncryptedBytes'

export class FileMemoryCache {
  private cache: Record<string, EncryptedBytes> = {}
  private orderedQueue: string[] = []

  constructor(public readonly maxSize: number) {}

  add(uuid: string, data: EncryptedBytes): boolean {
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

  get(uuid: string): EncryptedBytes | undefined {
    return this.cache[uuid]
  }

  remove(uuid: string): void {
    delete this.cache[uuid]

    removeFromArray(this.orderedQueue, uuid)
  }

  clear(): void {
    this.cache = {}

    this.orderedQueue = []
  }
}
