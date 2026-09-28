import HorizontalSeparator from '@/Components/Shared/HorizontalSeparator'
import { LinkButton, SmallText, Subtitle } from '@/Components/Preferences/PreferencesComponents/Content'
import { WebApplication } from '@/Application/WebApplication'
import { ListedAccount, ListedAccountInfo } from '@standardnotes/snjs'
import { FunctionComponent, useEffect, useState } from 'react'
import Spinner from '@/Components/Spinner/Spinner'
import { c } from 'ttag'

type Props = {
  account: ListedAccount
  showSeparator: boolean
  application: WebApplication
}

const ListedAccountItem: FunctionComponent<Props> = ({ account, showSeparator, application }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [accountInfo, setAccountInfo] = useState<ListedAccountInfo>()

  useEffect(() => {
    const loadAccount = async () => {
      setIsLoading(true)
      const info = await application.listed.getListedAccountInfo(account)
      setAccountInfo(info)
      setIsLoading(false)
    }
    loadAccount().catch(console.error)
  }, [account, application])

  const displayName = accountInfo?.display_name || account.authorId

  return (
    <>
      {isLoading ? (
        <div className="flex items-center">
          <Spinner className="h-4 w-4" />
        </div>
      ) : (
        <>
          <Subtitle className="em">{displayName}</Subtitle>
          <div className="mb-2" />
          <div className="flex flex-wrap gap-2">
            {accountInfo?.author_url && accountInfo.settings_url ? (
              <>
                <LinkButton
                  className="mr-2"
                  label={c('B6.Preferences.Other.Action').t`Open Blog`}
                  link={accountInfo.author_url}
                />
                <LinkButton
                  className="mr-2"
                  label={c('B6.Preferences.Other.Action').t`Settings`}
                  link={accountInfo.settings_url}
                />
              </>
            ) : (
              <SmallText>{c('B3.Notes.NoteList.Info').t`No actions available`}</SmallText>
            )}
          </div>
        </>
      )}
      {showSeparator && <HorizontalSeparator classes="mt-2.5 mb-3" />}
    </>
  )
}

export default ListedAccountItem
