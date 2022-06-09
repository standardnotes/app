// eslint-disable-next-line @typescript-eslint/no-var-requires
const faker = require('faker')
import { by, device, element, expect, waitFor } from 'detox'

export const expectToBeVisible = async (testedElement: Detox.IndexableNativeElement) => {
  try {
    await expect(testedElement).toBeVisible()
    return true
  } catch (e) {
    return false
  }
}

const checkAfterReinstall = async () => {
  if (device.getPlatform() === 'ios') {
    const alertElement = element(
      by.label('Delete Local Data').and(by.type('_UIAlertControllerActionView'))
    )
    const alertVisible = await expectToBeVisible(alertElement)
    if (alertVisible) {
      await element(
        by.label('Delete Local Data').and(by.type('_UIAlertControllerActionView'))
      ).tap()
    }
  }
}

export const openSettingsScreen = async () => {
  await checkAfterReinstall()
  await device.reloadReactNative()

  // Opens the settings screen
  await waitFor(element(by.id('rootView')))
    .toBeVisible()
    .withTimeout(2000)
  await element(by.id('headerButton')).tap()
  await element(by.id('settingsButton')).tap()
}

export const openComposeNewNoteScreen = async () => {
  await device.reloadReactNative()

  // Opens the screen to compose a new note
  await waitFor(element(by.id('rootView')))
    .toBeVisible()
    .withTimeout(2000)
  await waitFor(element(by.id('newNoteButton')))
    .toBeVisible()
    .withTimeout(2000)

  await element(by.id('newNoteButton')).tap()
}

export const randomCredentials = {
  email: faker.internet.exampleEmail(),
  password: faker.internet.password(),
  syncServerUrl: 'https://app-dev.standardnotes.com',
}
