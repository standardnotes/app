import { FunctionComponent } from 'react'
import { AppHost, AppUrl, jtString, LegacyAppHost } from '@standardnotes/features'
import { c } from 'ttag'

const DotOrgNotice: FunctionComponent = () => {
  return (
    <div className="z-modal flex h-30 w-full items-center bg-danger text-center text-info-contrast">
      <div className="w-full text-center text-xl font-bold">
        {jtString(c('B2.NavSharedUI.Warning').jt`${LegacyAppHost} is no longer maintained. Please switch to`)}{' '}
        <a className="underline" href={AppUrl}>
          {AppHost}
        </a>
      </div>
    </div>
  )
}

export default DotOrgNotice
