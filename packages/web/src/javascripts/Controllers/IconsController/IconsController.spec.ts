import { IconsController } from './IconsController'

describe('IconsController', () => {
  let iconsController: IconsController

  beforeEach(() => {
    iconsController = new IconsController()
  })

  describe('getIconForFileType', () => {
    it('should return correct icon type for supported mimetypes', () => {
      const iconTypeForPdf = iconsController.getIconForFileType('application/pdf')
      expect(iconTypeForPdf).toBe('file-pdf')

      const iconTypeForDoc = iconsController.getIconForFileType('application/msword')
      const iconTypeForDocx = iconsController.getIconForFileType(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      )
      expect(iconTypeForDoc).toBe('file-doc')
      expect(iconTypeForDocx).toBe('file-doc')

      const iconTypeForPpt = iconsController.getIconForFileType('application/vnd.ms-powerpoint')
      const iconTypeForPptx = iconsController.getIconForFileType(
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      )
      expect(iconTypeForPpt).toBe('file-ppt')
      expect(iconTypeForPptx).toBe('file-ppt')

      const iconTypeForXls = iconsController.getIconForFileType('application/vnd.ms-excel')
      const iconTypeForXlsx = iconsController.getIconForFileType(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.spreadsheet',
      )
      expect(iconTypeForXls).toBe('file-xls')
      expect(iconTypeForXlsx).toBe('file-xls')

      const iconTypeForJpg = iconsController.getIconForFileType('image/jpeg')
      const iconTypeForPng = iconsController.getIconForFileType('image/png')
      expect(iconTypeForJpg).toBe('file-image')
      expect(iconTypeForPng).toBe('file-image')

      const iconTypeForMpeg = iconsController.getIconForFileType('video/mpeg')
      const iconTypeForMp4 = iconsController.getIconForFileType('video/mp4')
      expect(iconTypeForMpeg).toBe('file-mov')
      expect(iconTypeForMp4).toBe('file-mov')

      const iconTypeForWav = iconsController.getIconForFileType('audio/wav')
      const iconTypeForMp3 = iconsController.getIconForFileType('audio/mp3')
      expect(iconTypeForWav).toBe('file-music')
      expect(iconTypeForMp3).toBe('file-music')

      const iconTypeForZip = iconsController.getIconForFileType('application/zip')
      const iconTypeForRar = iconsController.getIconForFileType('application/vnd.rar')
      const iconTypeForTar = iconsController.getIconForFileType('application/x-tar')
      const iconTypeFor7z = iconsController.getIconForFileType('application/x-7z-compressed')
      expect(iconTypeForZip).toBe('file-zip')
      expect(iconTypeForRar).toBe('file-zip')
      expect(iconTypeForTar).toBe('file-zip')
      expect(iconTypeFor7z).toBe('file-zip')
    })

    it('should return fallback icon type for unsupported mimetypes', () => {
      const iconForBin = iconsController.getIconForFileType('application/octet-stream')
      expect(iconForBin).toBe('file-other')

      const iconForNoType = iconsController.getIconForFileType('')
      expect(iconForNoType).toBe('file-other')
    })
  })
})
