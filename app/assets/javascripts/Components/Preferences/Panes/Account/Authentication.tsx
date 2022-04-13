import { AccountMenuPane } from '@/Components/AccountMenu'
import { Button } from '@/Components/Button/Button'
import {
  PreferencesGroup,
  PreferencesSegment,
  Text,
  Title,
} from '@/Components/Preferences/PreferencesComponents'
import { WebApplication } from '@/UIModels/Application'
import { AppState } from '@/UIModels/AppState'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'preact'
import { AccountIllustration } from '@standardnotes/stylekit'

export const Authentication: FunctionComponent<{
  application: WebApplication
  appState: AppState
}> = observer(({ appState }) => {
  const clickSignIn = () => {
    appState.preferences.closePreferences()
    appState.accountMenu.setCurrentPane(AccountMenuPane.SignIn)
    appState.accountMenu.setShow(true)
  }

  const clickRegister = () => {
    appState.preferences.closePreferences()
    appState.accountMenu.setCurrentPane(AccountMenuPane.Register)
    appState.accountMenu.setShow(true)
  }

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <div className="flex flex-col items-center px-12">
          <AccountIllustration className="mb-3" />
          <Title>You're not signed in</Title>
          <Text className="text-center mb-3">
            Sign in to sync your notes and preferences across all your devices and enable end-to-end
            encryption.
          </Text>
          <Button
            variant="primary"
            label="Create free account"
            onClick={clickRegister}
            className="mb-3"
          />
          <div className="text-input">
            Already have an account?{' '}
            <button
              className="border-0 p-0 bg-default color-info underline cursor-pointer"
              onClick={clickSignIn}
            >
              Sign in
            </button>
          </div>
        </div>
      </PreferencesSegment>
    </PreferencesGroup>
  )
})
