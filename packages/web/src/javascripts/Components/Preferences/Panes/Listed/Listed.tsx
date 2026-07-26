import { Title, Subtitle, Text } from '@/Components/Preferences/PreferencesComponents/Content'
import { observer } from 'mobx-react-lite'
import { WebApplication } from '@/Application/WebApplication'
import { ButtonType, ListedAccount } from '@standardnotes/snjs'
import { useCallback, useEffect, useState } from 'react'
import ListedAccountItem from './ListedAccountItem'
import Button from '@/Components/Button/Button'
import HorizontalSeparator from '@/Components/Shared/HorizontalSeparator'
import PreferencesPane from '../../PreferencesComponents/PreferencesPane'
import PreferencesGroup from '../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../PreferencesComponents/PreferencesSegment'
import { c } from 'ttag'

type Props = {
  application: WebApplication
}

const Listed = ({ application }: Props) => {
  const [accounts, setAccounts] = useState<ListedAccount[]>([])
  const [requestingAccount, setRequestingAccount] = useState<boolean>()

  const reloadAccounts = useCallback(async () => {
    if (application.hasAccount()) {
      setAccounts(await application.listed.getListedAccounts())
    }
  }, [application])

  useEffect(() => {
    reloadAccounts().catch(console.error)
  }, [reloadAccounts])

  const registerNewAccount = useCallback(() => {
    setRequestingAccount(true)

    const requestAccount = async () => {
      const account = await application.listed.requestNewListedAccount()
      if (account) {
        const openSettings = await application.alerts.confirm(
          c('B6.Settings.Listed.Info')
            .t`Your new Listed blog has been successfully created! You can publish a new post to your blog from Standard Notes via the <i>Actions</i> menu in the editor pane. Open your blog settings to begin setting it up.`,
          undefined,
          c('B6.Settings.Listed.Action').t`Open Settings`,
          ButtonType.Info,
          c('B6.Settings.Listed.Action').t`Later`,
        )
        reloadAccounts().catch(console.error)
        if (openSettings) {
          const info = await application.listed.getListedAccountInfo(account)
          if (info) {
            application.device.openUrl(info?.settings_url)
          }
        }
      }
      setRequestingAccount(false)
    }

    requestAccount().catch(console.error)
  }, [application, reloadAccounts])

  return (
    <PreferencesPane>
      {accounts.length > 0 && (
        <PreferencesGroup>
          <PreferencesSegment>
            <Title>
              {accounts.length === 1
                ? c('B6.Settings.Listed.Title').t`Your blog on Listed`
                : c('B6.Settings.Listed.Title').t`Your blogs on Listed`}
            </Title>
            <div className="h-2 w-full" />
            {accounts.map((item, index, array) => {
              return (
                <ListedAccountItem
                  account={item}
                  showSeparator={index !== array.length - 1}
                  key={item.authorId}
                  application={application}
                />
              )
            })}
          </PreferencesSegment>
        </PreferencesGroup>
      )}
      <PreferencesGroup>
        <PreferencesSegment>
          <Title>{c('B6.Preferences.Other.Title').t`About Listed`}</Title>
          <div className="h-2 w-full" />
          <Subtitle>{c('B6.Preferences.Other.Subtitle').t`What is Listed?`}</Subtitle>
          <Text>
            {c('B6.Settings.Listed.Info')
              .t`Listed is a free blogging platform that allows you to create a public journal published directly from your notes.`}{' '}
            {!application.sessions.getUser() &&
              c('B6.Settings.Listed.Info').t`To get started, sign in or register for a Standard Notes account.`}
          </Text>
          <a className="mt-2 text-info" target="_blank" href="https://listed.to" rel="noreferrer noopener">
            {c('B6.Settings.Listed.Action').t`Learn more`}
          </a>
        </PreferencesSegment>
        {application.sessions.getUser() && (
          <>
            <HorizontalSeparator classes="my-4" />
            <PreferencesSegment>
              <Subtitle>{c('B6.Preferences.Other.Subtitle').t`Get Started`}</Subtitle>
              <Text>{c('B6.Preferences.Other.Action').t`Create a free Listed author account to get started.`}</Text>
              <Button
                className="mt-3"
                disabled={requestingAccount}
                label={
                  requestingAccount
                    ? c('B6.Settings.Listed.Status').t`Creating account...`
                    : c('B6.Settings.Listed.Action').t`Create new author`
                }
                onClick={registerNewAccount}
              />
            </PreferencesSegment>
          </>
        )}
      </PreferencesGroup>
    </PreferencesPane>
  )
}

export default observer(Listed)
