import { FilesApiInterface } from '@standardnotes/services'
import { FileUploader } from './FileUploader'

describe('file uploader', () => {
  let apiService
  let uploader: FileUploader

  beforeEach(() => {
    apiService = {} as jest.Mocked<FilesApiInterface>
    apiService.uploadFileBytes = jest.fn().mockReturnValue(true)

    uploader = new FileUploader(apiService)
  })

  it('should return true when a chunk is uploaded', async () => {
    const bytes = new Uint8Array()
    const success = await uploader.uploadBytes(bytes, 2, 'api-token')

    expect(success).toEqual(true)
  })
})
