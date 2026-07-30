import { ProtocolExpirationDates, ProtocolVersion } from '@standardnotes/common'
import { HelpSecurityUrl, jtString } from '@standardnotes/features'
import { c } from 'ttag'

export const ConfirmStrings = {
  ProtocolVersionExpired(version: ProtocolVersion) {
    const expirationDate = ProtocolExpirationDates[version]?.toLocaleString()

    return {
      Message: jtString(
        c('B1.Account.SignIn.Info')
          .jt`The encryption version for your account is outdated and requires upgrade. You may proceed with login, but are advised to perform a security update using the web or desktop application.

If your account was created after ${expirationDate}, it may not be safe to continue signing in. In that case, please discontinue your sign in request and contact support.

For more information, visit ${HelpSecurityUrl}.`,
      ),
      Title: c('B1.Account.SignIn.Title').t`Update Recommended`,
      ConfirmButton: c('B1.Account.SignIn.Action').t`Sign In`,
    }
  },
}
