import { getIconForFileType } from './getIconForFileType'

describe('icons utils', () => {
  describe('getIconForFileType', () => {
    it('should return correct icon type for supported mimetypes', () => {
      const iconTypeForPdf = getIconForFileType('application/pdf')
      expect(iconTypeForPdf).toBe('file-pdf')

      const iconTypeForDoc = getIconForFileType('application/msword')
      const iconTypeForDocx = getIconForFileType(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      )
      expect(iconTypeForDoc).toBe('file-doc')
      expect(iconTypeForDocx).toBe('file-doc')

      const iconTypeForPpt = getIconForFileType('application/vnd.ms-powerpoint')
      const iconTypeForPptx = getIconForFileType(
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      )
      expect(iconTypeForPpt).toBe('file-ppt')
      expect(iconTypeForPptx).toBe('file-ppt')

      const iconTypeForXls = getIconForFileType('application/vnd.ms-excel')
      const iconTypeForXlsx = getIconForFileType(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.spreadsheet',
      )
      expect(iconTypeForXls).toBe('file-xls')
      expect(iconTypeForXlsx).toBe('file-xls')

      const iconTypeForJpg = getIconForFileType('image/jpeg')
      const iconTypeForPng = getIconForFileType('image/png')
      expect(iconTypeForJpg).toBe('file-image')
      expect(iconTypeForPng).toBe('file-image')

      const iconTypeForMpeg = getIconForFileType('video/mpeg')
      const iconTypeForMp4 = getIconForFileType('video/mp4')
      expect(iconTypeForMpeg).toBe('file-mov')
      expect(iconTypeForMp4).toBe('file-mov')

      const iconTypeForWav = getIconForFileType('audio/wav')
      const iconTypeForMp3 = getIconForFileType('audio/mp3')
      expect(iconTypeForWav).toBe('file-music')
      expect(iconTypeForMp3).toBe('file-music')

      const iconTypeForZip = getIconForFileType('application/zip')
      const iconTypeForRar = getIconForFileType('application/vnd.rar')
      const iconTypeForTar = getIconForFileType('application/x-tar')
      const iconTypeFor7z = getIconForFileType('application/x-7z-compressed')
      expect(iconTypeForZip).toBe('file-zip')
      expect(iconTypeForRar).toBe('file-zip')
      expect(iconTypeForTar).toBe('file-zip')
      expect(iconTypeFor7z).toBe('file-zip')
    })

    it('should return fallback icon type for unsupported mimetypes', () => {
      const iconForBin = getIconForFileType('application/octet-stream')
      expect(iconForBin).toBe('file-other')

      const iconForNoType = getIconForFileType('')
      expect(iconForNoType).toBe('file-other')
    })
  })
})
