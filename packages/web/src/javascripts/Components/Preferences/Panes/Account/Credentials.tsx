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
import { c } from 'ttag'

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

  const emailSpan = <span className="wrap font-bold">{user?.email}</span>
  const passwordDateSpan = <span className="font-bold">{passwordCreatedOn}</span>

  return (
    <>
      <PreferencesGroup>
        <PreferencesSegment>
          <Title>{c('B1.Account.Session.Title').t`Credentials`}</Title>
          <Subtitle>{c('B1.Account.Session.Subtitle').t`Email`}</Subtitle>
          <Text>{c('B1.Account.Session.Info').jt`You're signed in as ${emailSpan}`}</Text>
          <Button
            className="mt-3 min-w-20"
            label={c('B1.Account.Session.Action').t`Change email`}
            onClick={() => {
              setIsChangeEmailDialogOpen(true)
            }}
          />
          <HorizontalSeparator classes="my-4" />
          <Subtitle>{c('B1.Account.Password.Subtitle').t`Password`}</Subtitle>
          <Text>{c('B1.Account.Password.Info').jt`Current password was set on ${passwordDateSpan}`}</Text>
          <Button className="mt-3 min-w-20" label={c('B1.Account.Password.Action').t`Change password`} onClick={presentPasswordWizard} />
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
