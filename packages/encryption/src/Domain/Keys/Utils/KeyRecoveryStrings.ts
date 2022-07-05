import { KeyParamsOrigination } from '@standardnotes/common'
import { SNRootKeyParams } from '../RootKey/RootKeyParams'

export const KeyRecoveryStrings = {
  KeyRecoveryLoginFlowPrompt: (keyParams: SNRootKeyParams) => {
    const dateString = keyParams.createdDate?.toLocaleString()
    switch (keyParams.origination) {
      case KeyParamsOrigination.EmailChange:
        return `Enter your account password as it was when you changed your email on ${dateString}.`
      case KeyParamsOrigination.PasswordChange:
        return `Enter your account password after it was changed on ${dateString}.`
      case KeyParamsOrigination.Registration:
        return `Enter your account password as it was when you registered ${dateString}.`
      case KeyParamsOrigination.ProtocolUpgrade:
        return `Enter your account password as it was when you upgraded your encryption version on ${dateString}.`
      case KeyParamsOrigination.PasscodeChange:
        return `Enter your application passcode after it was changed on ${dateString}.`
      case KeyParamsOrigination.PasscodeCreate:
        return `Enter your application passcode as it was when you created it on ${dateString}.`
      default:
        throw Error('Unhandled KeyParamsOrigination case for KeyRecoveryLoginFlowPrompt')
    }
  },
  KeyRecoveryLoginFlowReason: 'Your account password is required to revalidate your session.',
  KeyRecoveryLoginFlowInvalidPassword: 'Incorrect credentials entered. Please try again.',
  KeyRecoveryRootKeyReplaced: 'Your credentials have successfully been updated.',
  KeyRecoveryPasscodeRequiredTitle: 'Passcode Required',
  KeyRecoveryPasscodeRequiredText: 'You must enter your passcode in order to save your new credentials.',
  KeyRecoveryPasswordRequired: 'Your account password is required to recover an encryption key.',
  KeyRecoveryKeyRecovered: 'Your key has successfully been recovered.',
  KeyRecoveryUnableToRecover: 'Unable to recover your key with the attempted password. Please try again.',
}
