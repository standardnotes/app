import Button from '@/Components/Button/Button'
import { Text, Title } from '@/Components/Preferences/PreferencesComponents/Content'
import { WebApplication } from '@/Application/Application'
import { ViewControllerManager } from '@/Services/ViewControllerManager'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'react'
import { AccountIllustration } from '@standardnotes/icons'
import { AccountMenuPane } from '@/Components/AccountMenu/AccountMenuPane'
import PreferencesGroup from '../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../PreferencesComponents/PreferencesSegment'

type Props = {
  application: WebApplication
  viewControllerManager: ViewControllerManager
}

const Authentication: FunctionComponent<Props> = ({ viewControllerManager }) => {
  const clickSignIn = () => {
    viewControllerManager.preferencesController.closePreferences()
    viewControllerManager.accountMenuController.setCurrentPane(AccountMenuPane.SignIn)
    viewControllerManager.accountMenuController.setShow(true)
  }

  const clickRegister = () => {
    viewControllerManager.preferencesController.closePreferences()
    viewControllerManager.accountMenuController.setCurrentPane(AccountMenuPane.Register)
    viewControllerManager.accountMenuController.setShow(true)
  }

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <div className="flex flex-col items-center px-12">
          <AccountIllustration className="mb-3" />
          <Title>You're not signed in</Title>
          <Text className="text-center mb-3">
            Sign in to sync your notes and preferences across all your devices and enable end-to-end encryption.
          </Text>
          <Button variant="primary" label="Create free account" onClick={clickRegister} className="mb-3" />
          <div className="text-input">
            Already have an account?{' '}
            <button className="border-0 p-0 bg-default color-info underline cursor-pointer" onClick={clickSignIn}>
              Sign in
            </button>
          </div>
        </div>
      </PreferencesSegment>
    </PreferencesGroup>
  )
}

export default observer(Authentication)
