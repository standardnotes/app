import { FunctionComponent } from 'react'
import { c } from 'ttag'

const DotOrgNotice: FunctionComponent = () => {
  return (
    <div className="z-modal flex h-30 w-full items-center bg-danger text-center text-info-contrast">
      <div className="w-full text-center text-xl font-bold">
        {c('B2.NavSharedUI.Warning').t`app.standardnotes.org is no longer maintained. Please switch to`}{' '}
        <a className="underline" href="https://app.standardnotes.com">
          app.standardnotes.com
        </a>
      </div>
    </div>
  )
}

export default DotOrgNotice
