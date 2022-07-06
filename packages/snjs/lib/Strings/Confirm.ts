import { ProtocolExpirationDates, ProtocolVersion } from '@standardnotes/common'

export const ConfirmStrings = {
  ProtocolVersionExpired(version: ProtocolVersion) {
    return {
      Message:
        'The encryption version for your account is outdated and requires upgrade. ' +
        'You may proceed with login, but are advised to perform a security update using the web or desktop application.\n\n' +
        `If your account was created after ${ProtocolExpirationDates[
          version
        ]?.toLocaleString()}, it may not be safe to continue signing in. ` +
        'In that case, please discontinue your sign in request and contact support.\n\n' +
        'For more information, visit standardnotes.com/help/security.',
      Title: 'Update Recommended',
      ConfirmButton: 'Sign In',
    }
  },
}
