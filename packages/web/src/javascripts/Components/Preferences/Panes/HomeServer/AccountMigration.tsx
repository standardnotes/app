import { Subtitle, Title } from '@/Components/Preferences/PreferencesComponents/Content'
import PreferencesPane from '../../PreferencesComponents/PreferencesPane'
import PreferencesGroup from '../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../PreferencesComponents/PreferencesSegment'
import { useApplication } from '@/Components/ApplicationProvider'
import DecoratedInput from '@/Components/Input/DecoratedInput'
import DecoratedPasswordInput from '@/Components/Input/DecoratedPasswordInput'
import Button from '@/Components/Button/Button'
import { useCallback, useState } from 'react'
import { AccountMigrationService } from '@standardnotes/snjs'

const LabelClassName = 'block mb-1'

const AccountMigration = () => {
  const application = useApplication()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [server, setServer] = useState('https://api.standardnotes.com')
  const [_isMigrating, setIsMigrating] = useState(false)

  const beginMigration = useCallback(async () => {
    setIsMigrating(true)
    const migrationService = new AccountMigrationService(application)
    void migrationService.importAccount(email, password, server)
  }, [application, email, password, server])

  return (
    <PreferencesPane>
      <PreferencesGroup>
        <PreferencesSegment>
          <Title>Account Transfer Tool</Title>
          <Subtitle>Migrate your data from another server to your home server.</Subtitle>
          <div className="flex w-full flex-col">
            <div className="mb-3">
              <label className={LabelClassName} htmlFor="email-input">
                Account Email:
              </label>
              <DecoratedInput
                type="email"
                value={email}
                id="change-email-email-input"
                onChange={(newEmail) => {
                  setEmail(newEmail)
                }}
              />
            </div>
            <div className="mb-2">
              <label className={LabelClassName} htmlFor="password-input">
                Account Password:
              </label>
              <DecoratedPasswordInput
                id="password-input"
                type="password"
                value={password}
                onChange={(value) => {
                  setPassword(value)
                }}
              />
            </div>
            <div className="mb-2">
              <label className={LabelClassName} htmlFor="server-input">
                Account Server:
              </label>
              <DecoratedInput
                id="server-input"
                type="text"
                value={server}
                onChange={(value) => {
                  setServer(value)
                }}
              />
            </div>
          </div>
          <div className="mt-3 flex flex-row">
            <Button label="Begin Migration" onClick={beginMigration} className="mr-3" />
          </div>
        </PreferencesSegment>
      </PreferencesGroup>
    </PreferencesPane>
  )
}

export default AccountMigration
