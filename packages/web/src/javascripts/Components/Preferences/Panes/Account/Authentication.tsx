import Button from '@/Components/Button/Button'
import { Text, Title } from '@/Components/Preferences/PreferencesComponents/Content'
import { WebApplication } from '@/Application/Application'
import { ViewControllerManager } from '@/Controllers/ViewControllerManager'
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
        <div className="flex flex-col items-center px-4 md:px-12">
          <AccountIllustration className="mb-3" />
          <Title>You're not signed in</Title>
          <Text className="mb-3 text-center">
            Sign in to sync your notes and preferences across all your devices and enable end-to-end encryption.
          </Text>
          <Button primary label="Create free account" onClick={clickRegister} className="mb-3" />
          <div className="text-sm">
            Already have an account?{' '}
            <button className="cursor-pointer border-0 bg-default p-0 text-info underline" onClick={clickSignIn}>
              Sign in
            </button>
          </div>
        </div>
      </PreferencesSegment>
    </PreferencesGroup>
  )
}

export default observer(Authentication)
