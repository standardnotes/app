import {
  PreferencesGroup,
  PreferencesSegment,
  Subtitle,
  Text,
  Title,
} from '@/Components/Preferences/PreferencesComponents'
import { Button } from '@/Components/Button/Button'
import { WebApplication } from '@/UIModels/Application'
import { observer } from '@node_modules/mobx-react-lite'
import { HorizontalSeparator } from '@/Components/Shared/HorizontalSeparator'
import { dateToLocalizedString } from '@standardnotes/snjs'
import { useCallback, useState } from 'preact/hooks'
import { ChangeEmail } from '@/Components/Preferences/Panes/Account/ChangeEmail'
import { FunctionComponent, render } from 'preact'
import { AppState } from '@/UIModels/AppState'
import { PasswordWizard } from '@/Components/PasswordWizard'

type Props = {
  application: WebApplication
  appState: AppState
}

export const Credentials: FunctionComponent<Props> = observer(({ application }: Props) => {
  const [isChangeEmailDialogOpen, setIsChangeEmailDialogOpen] = useState(false)

  const user = application.getUser()

  const passwordCreatedAtTimestamp = application.getUserPasswordCreationDate() as Date
  const passwordCreatedOn = dateToLocalizedString(passwordCreatedAtTimestamp)

  const presentPasswordWizard = useCallback(() => {
    render(<PasswordWizard application={application} />, document.body.appendChild(document.createElement('div')))
  }, [application])

  return (
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
        <HorizontalSeparator classes="mt-5 mb-3" />
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
  )
})
