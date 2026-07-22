import { FunctionComponent } from 'react'
import { c } from 'ttag'

const ChangeEmailSuccess: FunctionComponent = () => {
  return (
    <div>
      <div className={'mb-2 font-bold text-info'}>{c('B1.Account.Session.Info').t`Your email has been successfully changed.`}</div>
      <p>
        {c('B1.Account.Session.Info')
          .t`Please ensure you are running the latest version of Standard Notes on all platforms to ensure maximum compatibility.`}
      </p>
    </div>
  )
}

export default ChangeEmailSuccess
