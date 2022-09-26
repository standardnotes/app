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
        <Text>This action is irreversible. This will also delete all local items and preferences.</Text>
        <div className="mt-3 flex flex-row flex-wrap gap-3">
          <Button
            className="mt-3"
            colorStyle="danger"
            label="Delete my account for good"
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
