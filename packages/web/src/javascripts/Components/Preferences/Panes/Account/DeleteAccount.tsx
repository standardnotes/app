import { observer } from 'mobx-react-lite'
import PreferencesSegment from '@/Components/Preferences/PreferencesComponents/PreferencesSegment'
import { Text, Title } from '@/Components/Preferences/PreferencesComponents/Content'
import Button from '@/Components/Button/Button'
import PreferencesGroup from '@/Components/Preferences/PreferencesComponents/PreferencesGroup'
import { WebApplication } from '@/Application/WebApplication'

type Props = {
  application: WebApplication
}

const DeleteAccount = ({ application }: Props) => {
  if (!application.hasAccount()) {
    return null
  }
  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <Title>Delete account</Title>
        <Text>This action is irreversible. After deletion completes, you will be signed out on all devices.</Text>
        <div className="mt-3 flex flex-row flex-wrap gap-3">
          <Button
            colorStyle="danger"
            label="Delete my account"
            onClick={() => {
              application.accountMenuController.setDeletingAccount(true)
            }}
          />
        </div>
      </PreferencesSegment>
    </PreferencesGroup>
  )
}

export default observer(DeleteAccount)
