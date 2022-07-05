import { FilesApiInterface } from '@standardnotes/services'

export class FileUploader {
  constructor(private apiService: FilesApiInterface) {}

  public async uploadBytes(encryptedBytes: Uint8Array, chunkId: number, apiToken: string): Promise<boolean> {
    const result = await this.apiService.uploadFileBytes(apiToken, chunkId, encryptedBytes)

    return result
  }
}
