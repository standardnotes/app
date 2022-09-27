import { observer } from 'mobx-react-lite'
import PreferencesSegment from '@/Components/Preferences/PreferencesComponents/PreferencesSegment'
import { Text, Title } from '@/Components/Preferences/PreferencesComponents/Content'
import Button from '@/Components/Button/Button'
import PreferencesGroup from '@/Components/Preferences/PreferencesComponents/PreferencesGroup'
import { ViewControllerManager } from '@Controllers/ViewControllerManager'
import { WebApplication } from '@/Application/Application'

type Props = {
  application: WebApplication
  viewControllerManager: ViewControllerManager
}

const DeleteAccount = ({ application, viewControllerManager }: Props) => {
  if (!application.hasAccount()) {
    return null
  }
  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <Title>Delete account</Title>
        <Text>
          This action is irreversible. After deletion completes, you will be signed out on all devices. If you have an
          active paid subscription, cancel the subscription first. Otherwise, if you'd like to keep the subscription,
          you can re-register with the same email after deletion, and your subscription will be linked back up with your
          account.
        </Text>
        <div className="mt-3 flex flex-row flex-wrap gap-3">
          <Button
            colorStyle="danger"
            label="Delete my account"
            onClick={() => {
              viewControllerManager.accountMenuController.setDeletingAccount(true)
            }}
          />
        </div>
      </PreferencesSegment>
    </PreferencesGroup>
  )
}

export default observer(DeleteAccount)
