import { FunctionComponent } from 'react'
import { PreferencesGroup, PreferencesSegment } from '@/Components/Preferences/PreferencesComponents'
import { OfflineSubscription } from '@/Components/Preferences/Panes/Account/OfflineSubscription'
import { WebApplication } from '@/UIModels/Application'
import { observer } from 'mobx-react-lite'
import { AppState } from '@/UIModels/AppState'
import { Extensions } from '@/Components/Preferences/Panes/Extensions/Extensions'
import { ExtensionsLatestVersions } from '@/Components/Preferences/Panes/Extensions/ExtensionsLatestVersions'
import { AccordionItem } from '@/Components/Shared/AccordionItem'

interface IProps {
  application: WebApplication
  appState: AppState
  extensionsLatestVersions: ExtensionsLatestVersions
}

export const Advanced: FunctionComponent<IProps> = observer(({ application, appState, extensionsLatestVersions }) => {
  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <AccordionItem title={'Advanced Settings'}>
          <div className="flex flex-row items-center">
            <div className="flex-grow flex flex-col">
              <OfflineSubscription application={application} appState={appState} />
              <Extensions
                className={'mt-3'}
                application={application}
                extensionsLatestVersions={extensionsLatestVersions}
              />
            </div>
          </div>
        </AccordionItem>
      </PreferencesSegment>
    </PreferencesGroup>
  )
})
