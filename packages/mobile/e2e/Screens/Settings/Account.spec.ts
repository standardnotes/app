// eslint-disable-next-line @typescript-eslint/no-var-requires
const helpers = require('../../Helpers')
import { by, device, element, expect, waitFor } from 'detox'
import { openSettingsScreen } from '../../Helpers'
console.log('aaaa is', helpers)
// console.log('bbbb is', helpers2)
console.log('cccc is', helpers.openSettingsScreen === openSettingsScreen)

fdescribe('Account section', () => {
  describe('Form', () => {
    beforeAll(async () => {
      await helpers.openSettingsScreen()
    })

    it('should have the "Email" and "Password" fields visible', async () => {
      await expect(element(by.id('emailField'))).toBeVisible()
      await expect(element(by.id('passwordField'))).toBeVisible()
    })

    it('should have the "Sign In" button visible', async () => {
      await expect(element(by.id('signInButton'))).toBeVisible()
    })

    it('should have the "Register" button visible', async () => {
      await expect(element(by.id('registerButton'))).toBeVisible()
    })

    it('should have the "Other Options" button visible', async () => {
      await expect(element(by.id('otherOptionsButton'))).toBeVisible()
    })

    it('should have the "Sync Server" field visible when "Other Options" button is pressed', async () => {
      await element(by.id('otherOptionsButton')).tap()
      await expect(element(by.id('syncServerField'))).toBeVisible()
    })
  })

  describe('Register', () => {
    beforeAll(async () => {
      await helpers.openSettingsScreen()
    })

    it('should work when valid data is provided', async () => {
      await element(by.id('emailField')).typeText(helpers.randomCredentials.email)
      await element(by.id('passwordField')).typeText(helpers.randomCredentials.password)
      await element(by.id('otherOptionsButton')).tap()
      await element(by.id('syncServerField')).clearText()
      await element(by.id('syncServerField')).typeText(
        helpers.randomCredentials.syncServerUrl + '\n'
      )
      // wait for buttons to be visible after closing keyboard on smaller devices
      await waitFor(element(by.id('registerButton')))
        .toBeVisible()
        .withTimeout(1000)
      await element(by.id('registerButton')).tap()

      // A confirmation screen is shown after we click the register button...
      await expect(element(by.id('passwordConfirmationField'))).toBeVisible()
      await expect(element(by.id('registerConfirmButton'))).toBeVisible()

      // Password confirmation is required...
      await element(by.id('passwordConfirmationField')).typeText(helpers.randomCredentials.password)
      await element(by.id('registerConfirmButton')).tap()
    })

    afterAll(async () => {
      await helpers.openSettingsScreen()

      // Account is created and we now proceed to sign out...
      await expect(element(by.id('signOutButton'))).toBeVisible()
      await element(by.id('signOutButton')).tap()

      // Confirmation button in the dialog...
      if (device.getPlatform() === 'ios') {
        await element(by.label('Sign Out').and(by.type('_UIAlertControllerActionView'))).tap()
      } else {
        await expect(element(by.text('SIGN OUT'))).toBeVisible()
        await element(by.text('SIGN OUT')).tap()
      }
    })
  })

  describe('Sign In', () => {
    beforeAll(async () => {
      await helpers.openSettingsScreen()
    })

    it('should work when valid data is provided', async () => {
      await element(by.id('emailField')).typeText(helpers.randomCredentials.email)
      await element(by.id('passwordField')).typeText(helpers.randomCredentials.password)
      await element(by.id('otherOptionsButton')).tap()
      await element(by.id('syncServerField')).clearText()
      await element(by.id('syncServerField')).typeText(
        helpers.randomCredentials.syncServerUrl + '\n'
      )
      // wait for button to be visible after keyboard close
      await waitFor(element(by.id('signInButton')))
        .toBeVisible()
        .withTimeout(1000)
      await element(by.id('signInButton')).tap()
    })
  })
})
