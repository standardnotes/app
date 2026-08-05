import { FunctionComponent } from 'react'
import { jtString, SupportEmail } from '@standardnotes/features'
import { c } from 'ttag'

type Props = {
  componentName: string
}

const UrlMissing: FunctionComponent<Props> = ({ componentName }) => {
  return (
    <div className={'sn-component'}>
      <div className={'sk-panel static'}>
        <div className={'sk-panel-content'}>
          <div className={'sk-panel-section stretch'}>
            <div className={'sk-panel-section-title'}>
              {c('B2.NavSharedUI.Error').t`This extension is missing its URL property.`}
            </div>
            <p>
              {jtString(
                c('B2.NavSharedUI.Info')
                  .jt`In order to access your note immediately, please switch from ${componentName} to the Plain Editor.`,
              )}
            </p>
            <br />
            <p>{jtString(c('B2.NavSharedUI.Info').jt`Please contact ${SupportEmail} to remedy this issue.`)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UrlMissing
