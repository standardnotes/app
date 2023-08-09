import { observer } from 'mobx-react-lite'

import { WebApplication } from '@/Application/WebApplication'
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
}

const AccountPreferences = ({ application }: Props) => {
  const isUsingThirdPartyServer = !application.sessions.isSignedIntoFirstPartyServer()

  return (
    <PreferencesPane>
      {!application.hasAccount() ? (
        <Authentication application={application} />
      ) : (
        <>
          <Credentials application={application} />
          <Sync application={application} />
        </>
      )}
      <Subscription />
      <SubscriptionSharing application={application} />
      {application.hasAccount() && application.featuresController.entitledToFiles && (
        <FilesSection application={application} />
      )}
      {application.hasAccount() && !isUsingThirdPartyServer && <Email application={application} />}
      <SignOutWrapper application={application} />
      <DeleteAccount application={application} />
    </PreferencesPane>
  )
}

export default observer(AccountPreferences)
