import { observer } from 'mobx-react-lite'
import { WebApplication } from '@/Application/Application'
import { ViewControllerManager } from '@/Controllers/ViewControllerManager'
import Authentication from './Authentication'
import Credentials from './Credentials'
import Sync from './Sync'
import Subscription from './Subscription/Subscription'
import SignOutWrapper from './SignOutView'
import FilesSection from './Files'
import PreferencesPane from '../../PreferencesComponents/PreferencesPane'
import SubscriptionSharing from './SubscriptionSharing/SubscriptionSharing'

type Props = {
  application: WebApplication
  viewControllerManager: ViewControllerManager
}

const AccountPreferences = ({ application, viewControllerManager }: Props) => (
  <PreferencesPane>
    {!application.hasAccount() ? (
      <Authentication application={application} viewControllerManager={viewControllerManager} />
    ) : (
      <>
        <Credentials application={application} viewControllerManager={viewControllerManager} />
        <Sync application={application} />
      </>
    )}
    <Subscription application={application} viewControllerManager={viewControllerManager} />
    <SubscriptionSharing application={application} viewControllerManager={viewControllerManager} />
    {application.hasAccount() && viewControllerManager.featuresController.hasFiles && (
      <FilesSection application={application} />
    )}
    <SignOutWrapper application={application} viewControllerManager={viewControllerManager} />
  </PreferencesPane>
)

export default observer(AccountPreferences)
