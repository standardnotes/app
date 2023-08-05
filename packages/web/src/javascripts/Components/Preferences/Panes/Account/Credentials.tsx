import { Subtitle, Text, Title } from '@/Components/Preferences/PreferencesComponents/Content'
import Button from '@/Components/Button/Button'
import { WebApplication } from '@/Application/WebApplication'
import { observer } from 'mobx-react-lite'
import HorizontalSeparator from '@/Components/Shared/HorizontalSeparator'
import { dateToLocalizedString } from '@standardnotes/snjs'
import { useCallback, useState, FunctionComponent } from 'react'
import ChangeEmail from '@/Components/Preferences/Panes/Account/ChangeEmail/ChangeEmail'
import PasswordWizard from '@/Components/PasswordWizard/PasswordWizard'
import PreferencesGroup from '../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../PreferencesComponents/PreferencesSegment'
import ModalOverlay from '@/Components/Modal/ModalOverlay'

type Props = {
  application: WebApplication
}

const Credentials: FunctionComponent<Props> = ({ application }: Props) => {
  const [isChangeEmailDialogOpen, setIsChangeEmailDialogOpen] = useState(false)
  const [shouldShowPasswordWizard, setShouldShowPasswordWizard] = useState(false)

  const user = application.sessions.getUser()

  const passwordCreatedAtTimestamp = application.getUserPasswordCreationDate() as Date
  const passwordCreatedOn = dateToLocalizedString(passwordCreatedAtTimestamp)

  const presentPasswordWizard = useCallback(() => {
    setShouldShowPasswordWizard(true)
  }, [])

  const dismissPasswordWizard = useCallback(() => {
    setShouldShowPasswordWizard(false)
  }, [])

  const closeChangeEmailDialog = () => setIsChangeEmailDialogOpen(false)

  return (
    <>
      <PreferencesGroup>
        <PreferencesSegment>
          <Title>Credentials</Title>
          <Subtitle>Email</Subtitle>
          <Text>
            You're signed in as <span className="wrap font-bold">{user?.email}</span>
          </Text>
          <Button
            className="mt-3 min-w-20"
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
          <Button className="mt-3 min-w-20" label="Change password" onClick={presentPasswordWizard} />
          <ModalOverlay isOpen={isChangeEmailDialogOpen} close={closeChangeEmailDialog}>
            <ChangeEmail onCloseDialog={closeChangeEmailDialog} application={application} />
          </ModalOverlay>
        </PreferencesSegment>
      </PreferencesGroup>
      <ModalOverlay isOpen={shouldShowPasswordWizard} close={dismissPasswordWizard}>
        <PasswordWizard application={application} dismissModal={dismissPasswordWizard} />
      </ModalOverlay>
    </>
  )
}

export default observer(Credentials)
