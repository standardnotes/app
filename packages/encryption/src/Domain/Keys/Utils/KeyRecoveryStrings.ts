import { KeyParamsOrigination } from '@standardnotes/common'
import { c } from 'ttag'
import { SNRootKeyParams } from '../RootKey/RootKeyParams'

export const KeyRecoveryStrings = {
  KeyRecoveryLoginFlowPrompt: (keyParams: SNRootKeyParams) => {
    const dateString = keyParams.createdDate?.toLocaleString()
    switch (keyParams.origination) {
      case KeyParamsOrigination.EmailChange:
        return c('B5.SecuritySync.Challenge.Info')
          .t`Enter your account password as it was when you changed your email on ${dateString}.`
      case KeyParamsOrigination.PasswordChange:
        return c('B5.SecuritySync.Challenge.Info').t`Enter your account password after it was changed on ${dateString}.`
      case KeyParamsOrigination.Registration:
        return c('B5.SecuritySync.Challenge.Info')
          .t`Enter your account password as it was when you registered ${dateString}.`
      case KeyParamsOrigination.ProtocolUpgrade:
        return c('B5.SecuritySync.Challenge.Info')
          .t`Enter your account password as it was when you upgraded your encryption version on ${dateString}.`
      case KeyParamsOrigination.PasscodeChange:
        return c('B5.SecuritySync.Challenge.Info')
          .t`Enter your application passcode after it was changed on ${dateString}.`
      case KeyParamsOrigination.PasscodeCreate:
        return c('B5.SecuritySync.Challenge.Info')
          .t`Enter your application passcode as it was when you created it on ${dateString}.`
      default:
        throw Error('Unhandled KeyParamsOrigination case for KeyRecoveryLoginFlowPrompt')
    }
  },
  get KeyRecoveryLoginFlowReason() {
    return c('B5.SecuritySync.Challenge.Info').t`Your account password is required to revalidate your session.`
  },
  get KeyRecoveryLoginFlowInvalidPassword() {
    return c('B5.SecuritySync.Challenge.Error').t`Incorrect credentials entered. Please try again.`
  },
  get KeyRecoveryRootKeyReplaced() {
    return c('B5.SecuritySync.Challenge.Info').t`Your credentials have successfully been updated.`
  },
  get KeyRecoveryPasscodeRequiredTitle() {
    return c('B5.SecuritySync.Challenge.Label').t`Passcode Required`
  },
  get KeyRecoveryPasscodeRequiredText() {
    return c('B5.SecuritySync.Challenge.Info').t`You must enter your passcode in order to save your new credentials.`
  },
  get KeyRecoveryPasswordRequired() {
    return c('B5.SecuritySync.Challenge.Info').t`Your account password is required to recover an encryption key.`
  },
  get KeyRecoveryKeyRecovered() {
    return c('B5.SecuritySync.Challenge.Info').t`Your key has successfully been recovered.`
  },
  get KeyRecoveryUnableToRecover() {
    return c('B5.SecuritySync.Challenge.Error')
      .t`Unable to recover your key with the attempted password. Please try again.`
  },
}
