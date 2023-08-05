import Button from '@/Components/Button/Button'
import { Title } from '@/Components/Preferences/PreferencesComponents/Content'
import { WebApplication } from '@/Application/WebApplication'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'react'
import { AccountIllustration } from '@standardnotes/icons'
import { AccountMenuPane } from '@/Components/AccountMenu/AccountMenuPane'
import PreferencesGroup from '../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../PreferencesComponents/PreferencesSegment'

type Props = {
  application: WebApplication
}

const Authentication: FunctionComponent<Props> = ({ application }) => {
  const clickSignIn = () => {
    application.preferencesController.closePreferences()
    application.accountMenuController.setCurrentPane(AccountMenuPane.SignIn)
    application.accountMenuController.setShow(true)
  }

  const clickRegister = () => {
    application.preferencesController.closePreferences()
    application.accountMenuController.setCurrentPane(AccountMenuPane.Register)
    application.accountMenuController.setShow(true)
  }

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <div className="flex flex-col items-center px-4 md:px-12">
          <AccountIllustration className="mb-3" />
          <Title>You're not signed in</Title>
          <div className="mb-3 text-center text-base lg:text-sm">
            Sign in to sync your notes and preferences across all your devices and enable end-to-end encryption.
          </div>
          <Button primary label="Create free account" onClick={clickRegister} className="mb-3" />
          <div className="text-base lg:text-sm">
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
