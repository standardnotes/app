import { c } from 'ttag'

export const ErrorMessage = {
  get RegistrationInProgress() {
    return c('B1.Account.SignIn.Status').t`An existing registration request is already in progress.`
  },
  get GenericRegistrationFail() {
    return c('B1.Account.SignIn.Error').t`A server error occurred while trying to register. Please try again.`
  },
  get RateLimited() {
    return c('B2.NavSharedUI.Error').t`Too many successive server requests. Please wait a few minutes and try again.`
  },
  get InsufficientPasswordMessage() {
    return c('B1.Account.SignIn.Error')
      .t`Your password must be at least %LENGTH% characters in length. For your security, please choose a longer password or, ideally, a passphrase, and try again.`
  },
  get PasscodeRequired() {
    return c('B1.Account.SignIn.Error').t`Your passcode is required in order to register for an account.`
  },
  get GenericInProgress() {
    return c('B2.NavSharedUI.Error').t`An existing request is already in progress.`
  },
  get GenericFail() {
    return c('B2.NavSharedUI.Error').t`A server error occurred. Please try again.`
  },
}
