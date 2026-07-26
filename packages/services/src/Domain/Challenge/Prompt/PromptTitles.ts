/* istanbul ignore file */

import { c } from 'ttag'

export const ChallengePromptTitle = {
  get AccountPassword() {
    return c('B4.Security.Challenge.Label').t`Account Password`
  },
  get LocalPasscode() {
    return c('B4.Security.Challenge.Label').t`Application Passcode`
  },
  get Biometrics() {
    return c('B4.Security.Challenge.Label').t`Biometrics`
  },
  get RememberFor() {
    return c('B4.Security.Challenge.Label').t`Remember For`
  },
  get Mfa() {
    return c('B4.Security.Challenge.Label').t`Two-factor Authentication Code`
  },
  get U2F() {
    return c('B4.Security.Challenge.Label').t`Security Key`
  },
}
