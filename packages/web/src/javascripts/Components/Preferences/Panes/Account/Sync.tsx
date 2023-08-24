import { FunctionComponent, useCallback, useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'

import { Text, Title } from '@/Components/Preferences/PreferencesComponents/Content'
import Button from '@/Components/Button/Button'
import { SyncQueueStrategy } from '@standardnotes/snjs'
import { STRING_GENERIC_SYNC_ERROR } from '@/Constants/Strings'
import { WebApplication } from '@/Application/WebApplication'
import { formatLastSyncDate } from '@/Utils/DateUtils'
import PreferencesGroup from '../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../PreferencesComponents/PreferencesSegment'
import HorizontalSeparator from '@/Components/Shared/HorizontalSeparator'
import { featureTrunkTransitionEnabled } from '@/FeatureTrunk'

type Props = {
  application: WebApplication
}

const Sync: FunctionComponent<Props> = ({ application }: Props) => {
  const TRANSITION_STATUS_REFRESH_INTERVAL = 5000

  const [isSyncingInProgress, setIsSyncingInProgress] = useState(false)
  const [isTransitionInProgress, setIsTransitionInProgress] = useState(false)
  const [showTransitionSegment, setShowTransitionSegment] = useState(false)
  const [transitionStatus, setTransitionStatus] = useState('')
  const [transitionStatusIntervalRef, setTransitionStatusIntervalRef] = useState<NodeJS.Timer | null>(null)
  const [lastSyncDate, setLastSyncDate] = useState(formatLastSyncDate(application.sync.getLastSyncDate() as Date))

  const setupTransitionStatusRefresh = useCallback(async () => {
    const interval = setInterval(async () => {
      const statusOrError = await application.getTransitionStatus.execute()
      if (statusOrError.isFailed()) {
        await application.alerts.alert(statusOrError.getError())
        return
      }
      const status = statusOrError.getValue()

      setTransitionStatus(status)
    }, TRANSITION_STATUS_REFRESH_INTERVAL)

    setTransitionStatusIntervalRef(interval)
  }, [application, setTransitionStatus, setTransitionStatusIntervalRef])

  useEffect(() => {
    if (!featureTrunkTransitionEnabled()) {
      return
    }

    async function checkTransitionStatus() {
      const statusOrError = await application.getTransitionStatus.execute()
      if (statusOrError.isFailed()) {
        await application.alerts.alert(statusOrError.getError())
        return
      }
      const status = statusOrError.getValue()

      if (status === 'FINISHED') {
        if (transitionStatusIntervalRef) {
          clearInterval(transitionStatusIntervalRef)
        }
        setIsTransitionInProgress(false)
        setTransitionStatus(status)
        setShowTransitionSegment(false)

        return
      }

      setShowTransitionSegment(true)
      setTransitionStatus(status)

      if (status === 'STARTED') {
        setIsTransitionInProgress(true)
        if (!transitionStatusIntervalRef) {
          await setupTransitionStatusRefresh()
        }
      }
    }

    void checkTransitionStatus()
  }, [
    application,
    setIsTransitionInProgress,
    setTransitionStatus,
    setShowTransitionSegment,
    setupTransitionStatusRefresh,
    transitionStatusIntervalRef,
  ])

  const doSynchronization = async () => {
    setIsSyncingInProgress(true)

    const response = await application.sync.sync({
      queueStrategy: SyncQueueStrategy.ForceSpawnNew,
      checkIntegrity: true,
    })
    setIsSyncingInProgress(false)
    if (response && (response as any).error) {
      application.alerts.alert(STRING_GENERIC_SYNC_ERROR).catch(console.error)
    } else {
      setLastSyncDate(formatLastSyncDate(application.sync.getLastSyncDate() as Date))
    }
  }

  const doTransition = useCallback(async () => {
    const resultOrError = await application.startTransition.execute()
    if (resultOrError.isFailed()) {
      await application.alerts.alert(resultOrError.getError())

      return
    }

    setIsTransitionInProgress(true)

    await setupTransitionStatusRefresh()
  }, [application, setupTransitionStatusRefresh])

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <div className="flex flex-row items-center">
          <div className="flex flex-grow flex-col">
            <Title>Sync</Title>
            <Text>
              Last synced <span className="font-bold">on {lastSyncDate}</span>
            </Text>
            <Button
              className="mt-3 min-w-20"
              label="Sync now"
              disabled={isSyncingInProgress}
              onClick={doSynchronization}
            />
          </div>
        </div>
      </PreferencesSegment>
      {showTransitionSegment && (
        <>
          <HorizontalSeparator classes="my-4" />
          <PreferencesSegment>
            <div className="flex flex-row items-center">
              <div className="flex flex-grow flex-col">
                <Title>Transition Account</Title>
                <Text>
                  Transition your account to our new infrastructure in order to enable new features and improve your
                  overall experience. Depending on the amount of data you have, this process may take a few moments.
                </Text>
                {isTransitionInProgress && (
                  <Text>
                    <span className="font-bold">Transition status:</span> {transitionStatus}
                  </Text>
                )}
                {!isTransitionInProgress && (
                  <Button
                    className="mt-3 min-w-20"
                    label="Start transition"
                    disabled={isTransitionInProgress}
                    onClick={doTransition}
                  />
                )}
              </div>
            </div>
          </PreferencesSegment>
        </>
      )}
    </PreferencesGroup>
  )
}

export default observer(Sync)
