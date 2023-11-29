import { FunctionComponent } from 'react'
import OfflineSubscription from '@/Components/Preferences/Panes/General/Offline/OfflineSubscription'
import { observer } from 'mobx-react-lite'
import AccordionItem from '@/Components/Shared/AccordionItem'
import PreferencesGroup from '../../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../../PreferencesComponents/PreferencesSegment'
import { Platform } from '@standardnotes/snjs'
import { useApplication } from '@/Components/ApplicationProvider'

const OfflineActivation: FunctionComponent = () => {
  const application = useApplication()

  const shouldShowOfflineSubscription = () => {
    return (
      !application.hasAccount() ||
      !application.sessions.isSignedIntoFirstPartyServer() ||
      application.features.hasOfflineRepo()
    )
  }

  if (!shouldShowOfflineSubscription()) {
    return null
  }

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <AccordionItem title={'Offline activation'}>
          <div className="flex flex-row items-center">
            <div className="flex max-w-full flex-grow flex-col">
              {application.platform !== Platform.Ios && <OfflineSubscription application={application} />}
            </div>
          </div>
        </AccordionItem>
      </PreferencesSegment>
    </PreferencesGroup>
  )
}

export default observer(OfflineActivation)
