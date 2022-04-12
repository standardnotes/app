import { FunctionalComponent } from 'preact'
import { PreferencesGroup, PreferencesSegment } from '@/components/Preferences/Components'
import { OfflineSubscription } from '@/components/Preferences/Panes/Account/OfflineSubscription'
import { WebApplication } from '@/ui_models/application'
import { observer } from 'mobx-react-lite'
import { AppState } from '@/ui_models/app_state'
import { Extensions } from '@/components/Preferences/Panes/Extensions'
import { ExtensionsLatestVersions } from '@/components/Preferences/Panes/Extensions/ExtensionsLatestVersions'
import { AccordionItem } from '@/components/Shared/AccordionItem'

interface IProps {
  application: WebApplication
  appState: AppState
  extensionsLatestVersions: ExtensionsLatestVersions
}

export const Advanced: FunctionalComponent<IProps> = observer(
  ({ application, appState, extensionsLatestVersions }) => {
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
  },
)
