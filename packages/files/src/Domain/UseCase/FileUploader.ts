import { FileOwnershipType } from '../Api/FileOwnershipType'
import { FilesApiInterface } from '../Api/FilesApiInterface'

export class FileUploader {
  constructor(private apiService: FilesApiInterface) {}

  public async uploadBytes(
    encryptedBytes: Uint8Array,
    ownershipType: FileOwnershipType,
    chunkId: number,
    apiToken: string,
  ): Promise<boolean> {
    const result = await this.apiService.uploadFileBytes(apiToken, ownershipType, chunkId, encryptedBytes)

    return result
  }
}
