import { FunctionComponent } from 'react'
import { AppName, jtString } from '@standardnotes/features'
import { c } from 'ttag'

const ChangeEmailSuccess: FunctionComponent = () => {
  return (
    <div>
      <div className={'mb-2 font-bold text-info'}>{c('B6.Preferences.Account.Info')
        .t`Your email has been successfully changed.`}</div>
      <p>
        {jtString(
          c('B6.Preferences.Account.Info')
            .jt`Please ensure you are running the latest version of ${AppName} on all platforms to ensure maximum compatibility.`,
        )}
      </p>
    </div>
  )
}

export default ChangeEmailSuccess
