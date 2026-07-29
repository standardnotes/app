/* istanbul ignore file */

import { c } from 'ttag'

export const ChallengePromptTitle = {
  get AccountPassword() {
    return c('B5.SecuritySync.Challenge.Label').t`Account Password`
  },
  get LocalPasscode() {
    return c('B5.SecuritySync.Challenge.Label').t`Application Passcode`
  },
  get Biometrics() {
    return c('B5.SecuritySync.Challenge.Label').t`Biometrics`
  },
  get RememberFor() {
    return c('B5.SecuritySync.Challenge.Label').t`Remember For`
  },
  get Mfa() {
    return c('B5.SecuritySync.Challenge.Label').t`Two-factor Authentication Code`
  },
  get U2F() {
    return c('B5.SecuritySync.Challenge.Label').t`Security Key`
  },
}
