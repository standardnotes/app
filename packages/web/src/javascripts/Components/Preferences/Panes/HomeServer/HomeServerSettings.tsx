import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import Button from '@/Components/Button/Button'
import { Text } from '@/Components/Preferences/PreferencesComponents/Content'
import HorizontalSeparator from '@/Components/Shared/HorizontalSeparator'
import { useApplication } from '@/Components/ApplicationProvider'
import EncryptionStatusItem from '../Security/EncryptionStatusItem'
import Icon from '@/Components/Icon/Icon'
import OfflineSubscription from '../General/Advanced/OfflineSubscription'
import EnvironmentConfiguration from './Settings/EnvironmentConfiguration'
import DatabaseConfiguration from './Settings/DatabaseConfiguration'
import { Status } from '@/Components/StatusIndicator/Status'
import StatusIndicator from '@/Components/StatusIndicator/StatusIndicator'
import { HomeServerEnvironmentConfiguration } from '@standardnotes/snjs'

const HomeServerSettings = () => {
  const application = useApplication()
  const desktopDevice = application.desktopDevice
  const homeServerService = application.homeServer
  const featuresService = application.features
  const sessionsService = application.sessions
  const viewControllerManager = application.getViewControllerManager()

  const logsTextarea = useRef<HTMLTextAreaElement>(null)

  const [isAtBottom, setIsAtBottom] = useState(true)
  const [showLogs, setShowLogs] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [status, setStatus] = useState<Status>()
  const [homeServerDataLocation, setHomeServerDataLocation] = useState(homeServerService.getHomeServerDataLocation())
  const [isAPremiumUser, setIsAPremiumUser] = useState(false)
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [showOfflineSubscriptionActivation, setShowOfflineSubscriptionActivation] = useState(false)
  const [logsIntervalRef, setLogsIntervalRef] = useState<NodeJS.Timer | null>(null)
  const [homeServerConfiguration, setHomeServerConfiguration] = useState<HomeServerEnvironmentConfiguration | null>(
    null,
  )

  const refreshStatus = useCallback(async () => {
    if (!desktopDevice) {
      return
    }

    const result = await desktopDevice.homeServerStatus()
    setStatus({
      type: result.status === 'on' ? 'saved' : result.errorMessage ? 'error' : 'saving',
      message: result.status === 'on' ? 'Online' : result.errorMessage ? 'Offline' : 'Starting...',
      desc:
        result.status === 'on'
          ? `Accessible on local network via: ${result.url}`
          : result.errorMessage ?? 'Your home server is offline.',
    })
  }, [desktopDevice, setStatus])

  const setupLogsRefresh = useCallback(async () => {
    if (logsIntervalRef !== null) {
      clearInterval(logsIntervalRef)
    }

    if (!desktopDevice) {
      return
    }

    setLogs(await desktopDevice.getHomeServerLogs())

    const interval = setInterval(async () => {
      setLogs(await desktopDevice.getHomeServerLogs())
    }, 5000)
    setLogsIntervalRef(interval)
  }, [desktopDevice, logsIntervalRef])

  const initialyLoadHomeServerConfiguration = useCallback(async () => {
    if (!homeServerConfiguration) {
      const homeServerConfiguration = homeServerService.getHomeServerConfiguration()
      if (homeServerConfiguration) {
        setHomeServerConfiguration(homeServerConfiguration)
      }
    }
  }, [homeServerConfiguration, homeServerService])

  useEffect(() => {
    setIsAPremiumUser(featuresService.hasOfflineRepo())

    setIsSignedIn(sessionsService.isSignedIn())

    void initialyLoadHomeServerConfiguration()

    void refreshStatus()
  }, [featuresService, sessionsService, refreshStatus, initialyLoadHomeServerConfiguration])

  const handleHomeServerConfigurationChange = useCallback(
    async (changedServerConfiguration: HomeServerEnvironmentConfiguration) => {
      try {
        setStatus({ type: 'saving', message: 'Applying changes & restarting...' })

        setHomeServerConfiguration(changedServerConfiguration)

        await homeServerService.stopHomeServer()

        await homeServerService.setHomeServerConfiguration(changedServerConfiguration)

        const result = await homeServerService.startHomeServer()
        if (result !== undefined) {
          setStatus({ type: 'error', message: result })
        }

        setStatus({ type: 'saved', message: 'Online' })
      } catch (error) {
        setStatus({ type: 'error', message: (error as Error).message })
      }
    },
    [homeServerService, setStatus, setHomeServerConfiguration],
  )

  const changeHomeServerDataLocation = useCallback(async () => {
    try {
      await desktopDevice?.stopHomeServer()

      const newLocation = await homeServerService.changeHomeServerDataLocation()
      setHomeServerDataLocation(newLocation)

      const result = await desktopDevice?.startHomeServer()
      if (result !== undefined) {
        setStatus({ type: 'error', message: result })
      }
    } catch (error) {
      setStatus({ type: 'error', message: (error as Error).message })
    }
  }, [homeServerService, desktopDevice])

  const openHomeServerDataLocation = useCallback(async () => {
    try {
      await homeServerService.openHomeServerDataLocation()
    } catch (error) {
      setStatus({ type: 'error', message: (error as Error).message })
    }
  }, [homeServerService])

  const handleShowLogs = () => {
    const newValueForShowingLogs = !showLogs

    if (newValueForShowingLogs) {
      void setupLogsRefresh()
    } else {
      if (logsIntervalRef) {
        clearInterval(logsIntervalRef)
        setLogsIntervalRef(null)
      }
    }

    setShowLogs(newValueForShowingLogs)
  }

  function isTextareaScrolledToBottom(textarea: HTMLTextAreaElement) {
    const { scrollHeight, scrollTop, clientHeight } = textarea
    const scrolledToBottom = scrollTop + clientHeight >= scrollHeight
    return scrolledToBottom
  }

  useLayoutEffect(() => {
    if (logsTextarea.current) {
      setIsAtBottom(isTextareaScrolledToBottom(logsTextarea.current))
    }
  }, [logs])

  useEffect(() => {
    const handleScroll = () => {
      if (logsTextarea.current) {
        setIsAtBottom(isTextareaScrolledToBottom(logsTextarea.current))
      }
    }

    const textArea = logsTextarea.current

    if (textArea) {
      textArea.addEventListener('scroll', handleScroll)
    }

    return () => {
      if (textArea) {
        textArea.removeEventListener('scroll', handleScroll)
      }
    }
  }, [])

  useEffect(() => {
    if (logsTextarea.current && isAtBottom) {
      logsTextarea.current.scrollTop = logsTextarea.current.scrollHeight
    }
  }, [logs, isAtBottom])

  const getStatusString = useCallback(() => {
    return (
      <>
        <Text>Status: </Text>
        <StatusIndicator status={status} syncTakingTooLong={false} updateSavingIndicator={true} />
      </>
    )
  }, [status])

  return (
    <div>
      {getStatusString()}

      <HorizontalSeparator classes="my-4" />

      <>
        <Text className="mb-3">Home server is enabled and all data is stored at:</Text>

        <EncryptionStatusItem
          status={homeServerDataLocation || 'Not Set'}
          icon={<Icon type="attachment-file" className="min-h-5 min-w-5" />}
          checkmark={false}
        />

        <div className="mt-2.5 flex flex-row">
          <Button label="Open Location" className={'mr-3 text-xs'} onClick={openHomeServerDataLocation} />
          <Button label="Change Location" className={'mr-3 text-xs'} onClick={changeHomeServerDataLocation} />
        </div>
      </>

      <HorizontalSeparator classes="my-4" />

      {isSignedIn && !isAPremiumUser && (
        <div className="mt-3 flex flex-row flex-wrap gap-3">
          <Button
            label="Activate Premium Features"
            onClick={() => {
              setShowOfflineSubscriptionActivation(true)
            }}
          />
        </div>
      )}
      {showOfflineSubscriptionActivation && (
        <OfflineSubscription application={application} viewControllerManager={viewControllerManager} />
      )}

      <div className="mt-3 flex flex-row flex-wrap gap-3">
        <Button label={showLogs ? 'Hide Logs' : 'Show Logs'} onClick={handleShowLogs} />
      </div>
      {showLogs && (
        <div className="flex flex-col">
          <HorizontalSeparator classes="mt-3" />
          <textarea
            ref={logsTextarea}
            disabled={true}
            className="h-[500px] overflow-y-auto whitespace-pre-wrap bg-contrast p-2"
            value={logs.join('\n')}
          />
          <HorizontalSeparator classes="mb-3" />
        </div>
      )}
      <div className="h-2 w-full" />
      {homeServerConfiguration && (
        <>
          <HorizontalSeparator classes="my-4" />
          <EnvironmentConfiguration
            homeServerConfiguration={homeServerConfiguration}
            setHomeServerConfigurationChangedCallback={handleHomeServerConfigurationChange}
          />
          <HorizontalSeparator classes="my-4" />
          <DatabaseConfiguration
            homeServerConfiguration={homeServerConfiguration}
            setHomeServerConfigurationChangedCallback={handleHomeServerConfigurationChange}
          />
        </>
      )}
    </div>
  )
}

export default HomeServerSettings
