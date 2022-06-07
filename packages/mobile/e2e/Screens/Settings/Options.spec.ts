// eslint-disable-next-line @typescript-eslint/no-var-requires
const helpers = require('../../Helpers')
import { by, device, element, expect } from 'detox'

describe('Options section', () => {
  beforeAll(async () => {
    await helpers.openSettingsScreen()
  })

  describe('Export Data', () => {
    it('should have the option visible', async () => {
      await expect(element(by.id('exportData'))).toBeVisible()
      await expect(element(by.id('exportData-title'))).toHaveText('Export Data')
    })

    it('should restore to "Export Data" if dialog is dismissed', async () => {
      await expect(element(by.id('exportData-option-decrypted'))).toBeVisible()
      if (device.getPlatform() === 'android') {
        await element(by.id('exportData-option-decrypted')).tap()
        await device.pressBack()
        await expect(element(by.id('exportData-title'))).toHaveText('Export Data')
      }
    })

    it('should export decrypted notes', async () => {
      await expect(element(by.id('exportData-option-decrypted'))).toBeVisible()
      if (device.getPlatform() === 'android') {
        await element(by.id('exportData-option-decrypted')).tap()
        await element(by.text('SAVE TO DISK')).tap()

        await element(by.text('DONE')).tap()
        await expect(element(by.id('exportData-title'))).toHaveText('Export Data')
      }
    })
  })
})
