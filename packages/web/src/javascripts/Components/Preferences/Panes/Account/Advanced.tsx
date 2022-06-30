import { FunctionComponent } from 'react'
import OfflineSubscription from '@/Components/Preferences/Panes/Account/OfflineSubscription'
import { WebApplication } from '@/Application/Application'
import { observer } from 'mobx-react-lite'
import { ViewControllerManager } from '@/Services/ViewControllerManager'
import PackagesPreferencesSection from '@/Components/Preferences/Panes/General/Packages/PackagesPreferencesSection'
import { PackageProvider } from '@/Components/Preferences/Panes/General/Packages/Provider/PackageProvider'
import AccordionItem from '@/Components/Shared/AccordionItem'
import PreferencesGroup from '../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../PreferencesComponents/PreferencesSegment'

type Props = {
  application: WebApplication
  viewControllerManager: ViewControllerManager
  extensionsLatestVersions: PackageProvider
}

const Advanced: FunctionComponent<Props> = ({ application, viewControllerManager, extensionsLatestVersions }) => {
  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <AccordionItem title={'Advanced Settings'}>
          <div className="flex flex-row items-center">
            <div className="flex flex-grow flex-col">
              <OfflineSubscription application={application} viewControllerManager={viewControllerManager} />
              <PackagesPreferencesSection
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
}

export default observer(Advanced)
