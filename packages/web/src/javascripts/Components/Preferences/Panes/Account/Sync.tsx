import { FunctionComponent, useState } from 'react'
import { observer } from 'mobx-react-lite'

import { Text, Title } from '@/Components/Preferences/PreferencesComponents/Content'
import Button from '@/Components/Button/Button'
import { SyncQueueStrategy } from '@standardnotes/snjs'
import { STRING_GENERIC_SYNC_ERROR } from '@/Constants/Strings'
import { WebApplication } from '@/Application/WebApplication'
import { formatLastSyncDate } from '@/Utils/DateUtils'
import PreferencesGroup from '../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../PreferencesComponents/PreferencesSegment'
import { c, jt } from 'ttag'

type Props = {
  application: WebApplication
}

const Sync: FunctionComponent<Props> = ({ application }: Props) => {
  const [isSyncingInProgress, setIsSyncingInProgress] = useState(false)
  const [lastSyncDate, setLastSyncDate] = useState(formatLastSyncDate(application.sync.getLastSyncDate() as Date))

  const doSynchronization = async () => {
    setIsSyncingInProgress(true)

    const response = await application.sync.sync({
      queueStrategy: SyncQueueStrategy.ForceSpawnNew,
      checkIntegrity: true,
    })
    setIsSyncingInProgress(false)
    if (response && (response as any).error) {
      application.alerts.alert(STRING_GENERIC_SYNC_ERROR()).catch(console.error)
    } else {
      setLastSyncDate(formatLastSyncDate(application.sync.getLastSyncDate() as Date))
    }
  }

  const lastSyncSpan = <span className="font-bold">{c('Info').t`on ${lastSyncDate}`}</span>

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <div className="flex flex-row items-center">
          <div className="flex flex-grow flex-col">
            <Title>{c('Title').t`Sync`}</Title>
            <Text>{jt`Last synced ${lastSyncSpan}`}</Text>
            <Button
              className="mt-3 min-w-20"
              label={c('Action').t`Sync now`}
              disabled={isSyncingInProgress}
              onClick={doSynchronization}
            />
          </div>
        </div>
      </PreferencesSegment>
    </PreferencesGroup>
  )
}

export default observer(Sync)
