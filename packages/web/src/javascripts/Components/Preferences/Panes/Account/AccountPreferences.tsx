import { observer } from 'mobx-react-lite'
import { WebApplication } from '@/Application/WebApplication'
import { ViewControllerManager } from '@/Controllers/ViewControllerManager'
import Authentication from './Authentication'
import Credentials from './Credentials'
import Sync from './Sync'
import Subscription from './Subscription/Subscription'
import SignOutWrapper from './SignOutView'
import FilesSection from './Files'
import PreferencesPane from '../../PreferencesComponents/PreferencesPane'
import SubscriptionSharing from './SubscriptionSharing/SubscriptionSharing'
import Email from './Email/Email'
import DeleteAccount from '@/Components/Preferences/Panes/Account/DeleteAccount'

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
    {application.hasAccount() && viewControllerManager.featuresController.entitledToFiles && (
      <FilesSection application={application} />
    )}
    {application.hasAccount() && <Email application={application} />}
    <SignOutWrapper application={application} viewControllerManager={viewControllerManager} />
    <DeleteAccount application={application} viewControllerManager={viewControllerManager} />
  </PreferencesPane>
)

export default observer(AccountPreferences)
