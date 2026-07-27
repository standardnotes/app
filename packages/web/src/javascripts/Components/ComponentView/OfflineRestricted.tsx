import { FunctionComponent } from 'react'
import { c } from 'ttag'

const OfflineRestricted: FunctionComponent = () => {
  return (
    <div className={'sn-component'}>
      <div className={'sk-panel static'}>
        <div className={'sk-panel-content'}>
          <div className={'sk-panel-section stretch'}>
            <div className={'sk-panel-column'} />
            <div className="text-base font-bold">
              {c('B2.NavSharedUI.Info').t`You have restricted this component to not use a hosted version.`}
            </div>
            <div className={'sk-subtitle'}>
              {c('B2.NavSharedUI.Info').t`Locally-installed components are not available in the web application.`}
            </div>
            <div className={'sk-panel-row'} />
            <div className={'sk-panel-row'}>
              <div className={'sk-panel-column'}>
                <div className={'sk-p'}>{c('B2.NavSharedUI.Info')
                  .t`To continue, choose from the following options:`}</div>
                <ul className="mt-3 list-disc pl-8">
                  <li className="sk-p mb-1">
                    {c('B2.NavSharedUI.Info')
                      .t`Enable the Hosted option for this component by opening the Preferences > General > Advanced Settings menu and toggling 'Use hosted when local is unavailable' under this component's options. Then press Reload.`}
                  </li>
                  <li className={'sk-p'}>{c('B2.NavSharedUI.Info').t`Use the desktop application.`}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OfflineRestricted
