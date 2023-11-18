import { FunctionComponent } from 'react'
import OfflineSubscription from '@/Components/Preferences/Panes/General/Advanced/OfflineSubscription'
import { WebApplication } from '@/Application/WebApplication'
import { observer } from 'mobx-react-lite'
import AccordionItem from '@/Components/Shared/AccordionItem'
import PreferencesGroup from '../../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../../PreferencesComponents/PreferencesSegment'
import { Platform } from '@standardnotes/snjs'

type Props = {
  application: WebApplication
}

const Advanced: FunctionComponent<Props> = ({ application }) => {
  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <AccordionItem title={'Advanced options'}>
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

export default observer(Advanced)
