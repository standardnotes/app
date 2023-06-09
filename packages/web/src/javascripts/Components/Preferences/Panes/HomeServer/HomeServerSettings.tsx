import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import Button from '@/Components/Button/Button'
import { Text } from '@/Components/Preferences/PreferencesComponents/Content'
import HorizontalSeparator from '@/Components/Shared/HorizontalSeparator'
import { useApplication } from '@/Components/ApplicationProvider'
import { HomeServerStatus } from '@standardnotes/snjs'
import EncryptionStatusItem from '../Security/EncryptionStatusItem'
import Icon from '@/Components/Icon/Icon'
import OfflineSubscription from '../General/Advanced/OfflineSubscription'

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
  const [status, setStatus] = useState<HomeServerStatus>()
  const [homeServerDataLocation, setHomeServerDataLocation] = useState(homeServerService.getHomeServerDataLocation())
  const [isAPremiumUser, setIsAPremiumUser] = useState(false)
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [showOfflineSubscriptionActivation, setShowOfflineSubscriptionActivation] = useState(false)
  const [logsIntervalRef, setLogsIntervalRef] = useState<NodeJS.Timer | null>(null)

  const refreshStatus = useCallback(async () => {
    if (desktopDevice) {
      const result = await desktopDevice.serverStatus()
      setStatus(result)
    }
  }, [desktopDevice])

  const setupLogsRefresh = useCallback(async () => {
    if (logsIntervalRef !== null) {
      clearInterval(logsIntervalRef)
    }

    if (!desktopDevice) {
      return
    }

    setLogs(await desktopDevice.getServerLogs())

    const interval = setInterval(async () => {
      setLogs(await desktopDevice.getServerLogs())
    }, 5000)
    setLogsIntervalRef(interval)
  }, [desktopDevice, logsIntervalRef])

  useEffect(() => {
    setIsAPremiumUser(featuresService.hasOfflineRepo())

    setIsSignedIn(sessionsService.isSignedIn())

    void refreshStatus()
  }, [featuresService, sessionsService, desktopDevice, showLogs, refreshStatus])

  const changeHomeServerDataLocation = useCallback(async () => {
    await desktopDevice?.stopServer()
    const newLocation = await homeServerService.changeHomeServerDataLocation()
    setHomeServerDataLocation(newLocation)
    await desktopDevice?.startServer()
  }, [homeServerService, desktopDevice])

  const openHomeServerDataLocation = useCallback(async () => {
    await homeServerService.openHomeServerDataLocation()
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
    if (!status) {
      return undefined
    }

    if (status.status === 'on') {
      return (
        <Text>
          Accessible on local network via{' '}
          <a target="_blank" className="font-bold text-info" href={status.url}>
            {status.url}
          </a>
          {'.'}
        </Text>
      )
    } else if (status.status === 'off') {
      return <Text>Not started</Text>
    }
  }, [status])

  return (
    <div>
      {status ? getStatusString() : <Text>Status unavailable</Text>}

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
    </div>
  )
}

export default HomeServerSettings
