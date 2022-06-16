import { Subtitle, Text, Title } from '@/Components/Preferences/PreferencesComponents/Content'
import Button from '@/Components/Button/Button'
import { WebApplication } from '@/Application/Application'
import { observer } from 'mobx-react-lite'
import HorizontalSeparator from '@/Components/Shared/HorizontalSeparator'
import { dateToLocalizedString } from '@standardnotes/snjs'
import { useCallback, useState, FunctionComponent } from 'react'
import ChangeEmail from '@/Components/Preferences/Panes/Account/ChangeEmail/ChangeEmail'
import { ViewControllerManager } from '@/Services/ViewControllerManager'
import PasswordWizard from '@/Components/PasswordWizard/PasswordWizard'
import PreferencesGroup from '../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../PreferencesComponents/PreferencesSegment'

type Props = {
  application: WebApplication
  viewControllerManager: ViewControllerManager
}

const Credentials: FunctionComponent<Props> = ({ application }: Props) => {
  const [isChangeEmailDialogOpen, setIsChangeEmailDialogOpen] = useState(false)
  const [shouldShowPasswordWizard, setShouldShowPasswordWizard] = useState(false)

  const user = application.getUser()

  const passwordCreatedAtTimestamp = application.getUserPasswordCreationDate() as Date
  const passwordCreatedOn = dateToLocalizedString(passwordCreatedAtTimestamp)

  const presentPasswordWizard = useCallback(() => {
    setShouldShowPasswordWizard(true)
  }, [])

  const dismissPasswordWizard = useCallback(() => {
    setShouldShowPasswordWizard(false)
  }, [])

  return (
    <>
      <PreferencesGroup>
        <PreferencesSegment>
          <Title>Credentials</Title>
          <Subtitle>Email</Subtitle>
          <Text>
            You're signed in as <span className="font-bold wrap">{user?.email}</span>
          </Text>
          <Button
            className="min-w-20 mt-3"
            variant="normal"
            label="Change email"
            onClick={() => {
              setIsChangeEmailDialogOpen(true)
            }}
          />
          <HorizontalSeparator classes="my-4" />
          <Subtitle>Password</Subtitle>
          <Text>
            Current password was set on <span className="font-bold">{passwordCreatedOn}</span>
          </Text>
          <Button className="min-w-20 mt-3" variant="normal" label="Change password" onClick={presentPasswordWizard} />
          {isChangeEmailDialogOpen && (
            <ChangeEmail onCloseDialog={() => setIsChangeEmailDialogOpen(false)} application={application} />
          )}
        </PreferencesSegment>
      </PreferencesGroup>
      {shouldShowPasswordWizard ? (
        <PasswordWizard application={application} dismissModal={dismissPasswordWizard} />
      ) : null}
    </>
  )
}

export default observer(Credentials)
