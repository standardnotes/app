import { FunctionComponent } from 'react'
import OfflineSubscription from '@/Components/Preferences/Panes/General/Advanced/OfflineSubscription'
import { WebApplication } from '@/Application/WebApplication'
import { observer } from 'mobx-react-lite'
import PackagesPreferencesSection from '@/Components/Preferences/Panes/General/Advanced/Packages/Section'
import { PackageProvider } from '@/Components/Preferences/Panes/General/Advanced/Packages/Provider/PackageProvider'
import AccordionItem from '@/Components/Shared/AccordionItem'
import PreferencesGroup from '../../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../../PreferencesComponents/PreferencesSegment'
import { Platform } from '@standardnotes/snjs'

type Props = {
  application: WebApplication
  extensionsLatestVersions: PackageProvider
}

const Advanced: FunctionComponent<Props> = ({ application, extensionsLatestVersions }) => {
  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <AccordionItem title={'Advanced options'}>
          <div className="flex flex-row items-center">
            <div className="flex max-w-full flex-grow flex-col">
              {application.platform !== Platform.Ios && <OfflineSubscription application={application} />}
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
