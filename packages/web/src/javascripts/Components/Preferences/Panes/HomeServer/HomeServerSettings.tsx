import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import Button from '@/Components/Button/Button'
import { Pill, Subtitle, Text, Title } from '@/Components/Preferences/PreferencesComponents/Content'
import HorizontalSeparator from '@/Components/Shared/HorizontalSeparator'
import { useApplication } from '@/Components/ApplicationProvider'
import EncryptionStatusItem from '../Security/EncryptionStatusItem'
import Icon from '@/Components/Icon/Icon'
import OfflineSubscription from '../General/Offline/OfflineSubscription'
import EnvironmentConfiguration from './Settings/EnvironmentConfiguration'
import DatabaseConfiguration from './Settings/DatabaseConfiguration'
import { HomeServerEnvironmentConfiguration, HomeServerServiceInterface, classNames, sleep } from '@standardnotes/snjs'
import StatusIndicator from './Status/StatusIndicator'
import { Status } from './Status/Status'
import { PremiumFeatureIconClass, PremiumFeatureIconName } from '@/Components/Icon/PremiumFeatureIcon'
import Switch from '@/Components/Switch/Switch'
import AccordionItem from '@/Components/Shared/AccordionItem'
import PreferencesSegment from '../../PreferencesComponents/PreferencesSegment'
import PreferencesGroup from '../../PreferencesComponents/PreferencesGroup'

const HomeServerSettings = () => {
  const SERVER_SYNTHEIC_CHANGE_DELAY = 1500
  const LOGS_REFRESH_INTERVAL = 5000

  const application = useApplication()
  const homeServerService = application.homeServer as HomeServerServiceInterface
  const featuresService = application.features
  const sessionsService = application.sessions

  const logsTextarea = useRef<HTMLTextAreaElement>(null)

  const [isAtBottom, setIsAtBottom] = useState(true)
  const [showLogs, setShowLogs] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [status, setStatus] = useState<Status>()
  const [homeServerDataLocation, setHomeServerDataLocation] = useState('')
  const [isAPremiumUser, setIsAPremiumUser] = useState(false)
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [showOfflineSubscriptionActivation, setShowOfflineSubscriptionActivation] = useState(false)
  const [logsIntervalRef, setLogsIntervalRef] = useState<NodeJS.Timer | null>(null)
  const [homeServerConfiguration, setHomeServerConfiguration] = useState<HomeServerEnvironmentConfiguration | null>(
    null,
  )
  const [homeServerEnabled, setHomeServerEnabled] = useState(false)

  const refreshStatus = useCallback(async () => {
    const result = await homeServerService.getHomeServerStatus()
    setStatus({
      state: result.status === 'on' ? 'online' : result.errorMessage ? 'error' : 'offline',
      message: result.status === 'on' ? 'Online' : result.errorMessage ? 'Offline' : 'Starting...',
      description:
        result.status === 'on' ? (
          <>
            Accessible on local network at{' '}
            <a href={result.url} className="font-bold text-info" target="_blank">
              {result.url}
            </a>
          </>
        ) : (
          result.errorMessage ?? 'Your home server is offline.'
        ),
    })
  }, [homeServerService, setStatus])

  const initialyLoadHomeServerConfiguration = useCallback(async () => {
    if (!homeServerConfiguration) {
      const homeServerConfiguration = await homeServerService.getHomeServerConfiguration()
      if (homeServerConfiguration) {
        setHomeServerConfiguration(homeServerConfiguration)
      }
    }
  }, [homeServerConfiguration, homeServerService])

  const toggleHomeServer = useCallback(async () => {
    if (status?.state === 'restarting') {
      return
    }

    if (homeServerEnabled) {
      setStatus({ state: 'restarting', message: 'Shutting down...' })

      const result = await homeServerService.disableHomeServer()

      await sleep(SERVER_SYNTHEIC_CHANGE_DELAY)

      if (result.isFailed() && (await homeServerService.isHomeServerRunning())) {
        setStatus({ state: 'error', message: result.getError() })

        return
      }

      setHomeServerEnabled(await homeServerService.isHomeServerEnabled())

      await refreshStatus()
    } else {
      setStatus({ state: 'restarting', message: 'Starting...' })

      await homeServerService.enableHomeServer()

      setHomeServerEnabled(await homeServerService.isHomeServerEnabled())

      await sleep(SERVER_SYNTHEIC_CHANGE_DELAY)

      await refreshStatus()

      void initialyLoadHomeServerConfiguration()
    }
  }, [homeServerEnabled, homeServerService, status, refreshStatus, initialyLoadHomeServerConfiguration])

  const clearLogs = useCallback(
    (hideLogs = false) => {
      if (logsIntervalRef !== null) {
        clearInterval(logsIntervalRef)
      }
      if (hideLogs) {
        setShowLogs(false)
      }
      setLogs([])
    },
    [setLogs, logsIntervalRef],
  )

  const setupLogsRefresh = useCallback(async () => {
    clearLogs()

    setLogs(await homeServerService.getHomeServerLogs())

    const interval = setInterval(async () => {
      setLogs(await homeServerService.getHomeServerLogs())
    }, LOGS_REFRESH_INTERVAL)
    setLogsIntervalRef(interval)
  }, [homeServerService, clearLogs])

  useEffect(() => {
    async function updateHomeServerDataLocation() {
      const location = await homeServerService.getHomeServerDataLocation()
      if (location) {
        setHomeServerDataLocation(location)
      }
    }

    void updateHomeServerDataLocation()

    async function updateHomeServerEnabled() {
      setHomeServerEnabled(await homeServerService.isHomeServerEnabled())
    }

    void updateHomeServerEnabled()

    setIsAPremiumUser(featuresService.hasOfflineRepo())

    setIsSignedIn(sessionsService.isSignedIn())

    void initialyLoadHomeServerConfiguration()

    void refreshStatus()
  }, [featuresService, sessionsService, homeServerService, refreshStatus, initialyLoadHomeServerConfiguration])

  const handleHomeServerConfigurationChange = useCallback(
    async (changedServerConfiguration: HomeServerEnvironmentConfiguration) => {
      try {
        setStatus({ state: 'restarting', message: 'Applying changes and restarting...' })

        setHomeServerConfiguration(changedServerConfiguration)

        await homeServerService.stopHomeServer()

        await sleep(SERVER_SYNTHEIC_CHANGE_DELAY)

        await homeServerService.setHomeServerConfiguration(changedServerConfiguration)

        clearLogs(true)

        const result = await homeServerService.startHomeServer()
        if (result !== undefined) {
          setStatus({ state: 'error', message: result })
        }

        void refreshStatus()
      } catch (error) {
        setStatus({ state: 'error', message: (error as Error).message })
      }
    },
    [homeServerService, setStatus, setHomeServerConfiguration, refreshStatus, clearLogs],
  )

  const changeHomeServerDataLocation = useCallback(
    async (location?: string) => {
      try {
        await homeServerService.stopHomeServer()

        if (location === undefined) {
          const oldLocation = await homeServerService.getHomeServerDataLocation()
          const newLocationOrError = await homeServerService.changeHomeServerDataLocation()
          if (newLocationOrError.isFailed()) {
            setStatus({
              state: 'error',
              message: `${newLocationOrError.getError()}. Restoring to initial location in a moment...`,
            })

            await sleep(2 * SERVER_SYNTHEIC_CHANGE_DELAY)

            await changeHomeServerDataLocation(oldLocation)

            return
          }
          location = newLocationOrError.getValue()
        }

        setStatus({ state: 'restarting', message: 'Applying changes and restarting...' })

        await sleep(SERVER_SYNTHEIC_CHANGE_DELAY)

        setHomeServerDataLocation(location)

        clearLogs(true)

        const result = await homeServerService.startHomeServer()
        if (result !== undefined) {
          setStatus({ state: 'error', message: result })
        }

        void refreshStatus()
      } catch (error) {
        setStatus({ state: 'error', message: (error as Error).message })
      }
    },
    [homeServerService, setStatus, setHomeServerDataLocation, refreshStatus, clearLogs],
  )

  const openHomeServerDataLocation = useCallback(async () => {
    try {
      await homeServerService.openHomeServerDataLocation()
    } catch (error) {
      setStatus({ state: 'error', message: (error as Error).message })
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
      if (logsIntervalRef !== null) {
        clearInterval(logsIntervalRef)
      }
    }
  }, [logsIntervalRef])

  useEffect(() => {
    if (logsTextarea.current && isAtBottom) {
      logsTextarea.current.scrollTop = logsTextarea.current.scrollHeight
    }
  }, [logs, isAtBottom])

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-start">
          <Title>Home Server</Title>
          <Pill style={'success'}>Labs</Pill>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="mr-10 flex flex-col">
          <Subtitle>Sync your data on a private cloud running on your home computer.</Subtitle>
        </div>
        <Switch disabled={status?.state === 'restarting'} onChange={toggleHomeServer} checked={homeServerEnabled} />
      </div>
      {homeServerEnabled && (
        <div>
          <StatusIndicator className={'mr-3'} status={status} homeServerService={homeServerService} />

          {status?.state !== 'restarting' && (
            <>
              <HorizontalSeparator classes="my-4" />
              <>
                <Text className="mb-3">Home server is enabled. All data is stored at:</Text>

                <EncryptionStatusItem
                  status={homeServerDataLocation || 'Not Set'}
                  icon={<Icon type="attachment-file" className="min-h-5 min-w-5" />}
                  checkmark={false}
                />

                <div className="mt-2.5 flex flex-row">
                  <Button label="Open Location" className={'mr-3 text-xs'} onClick={openHomeServerDataLocation} />
                  <Button
                    label="Change Location"
                    className={'mr-3 text-xs'}
                    onClick={() => changeHomeServerDataLocation()}
                  />
                </div>
              </>
              <HorizontalSeparator classes="my-4" />
              <PreferencesGroup>
                <PreferencesSegment>
                  <AccordionItem title={'Logs'} onClick={handleShowLogs}>
                    <div className="flex flex-row items-center">
                      <div className="flex max-w-full flex-grow flex-col">
                        <textarea
                          ref={logsTextarea}
                          disabled={true}
                          className="h-[500px] overflow-y-auto whitespace-pre-wrap bg-contrast p-2"
                          value={logs.join('\n')}
                        />
                      </div>
                    </div>
                  </AccordionItem>
                </PreferencesSegment>
              </PreferencesGroup>
              {homeServerConfiguration && (
                <>
                  <HorizontalSeparator classes="my-4" />
                  <DatabaseConfiguration
                    homeServerConfiguration={homeServerConfiguration}
                    setHomeServerConfigurationChangedCallback={handleHomeServerConfigurationChange}
                  />
                  <HorizontalSeparator classes="my-4" />
                  <EnvironmentConfiguration
                    homeServerConfiguration={homeServerConfiguration}
                    setHomeServerConfigurationChangedCallback={handleHomeServerConfigurationChange}
                  />
                </>
              )}

              {isSignedIn && !isAPremiumUser && (
                <>
                  <HorizontalSeparator classes="my-4" />
                  <div className={'mt-2 grid grid-cols-1 rounded-md border border-border p-4'}>
                    <div className="flex items-center">
                      <Icon
                        className={classNames('-ml-1 mr-1 h-5 w-5', PremiumFeatureIconClass)}
                        type={PremiumFeatureIconName}
                      />
                      <h1 className="sk-h3 m-0 text-sm font-semibold">Activate Premium Features</h1>
                    </div>
                    <p className="col-start-1 col-end-3 m-0 mt-1 text-sm">
                      Enter your purchased offline subscription code to activate all the features offered by your home
                      server, likes files support and Super notes.
                    </p>
                    <Button
                      primary
                      small
                      className="col-start-1 col-end-3 mt-3 justify-self-start uppercase"
                      onClick={() => {
                        setShowOfflineSubscriptionActivation(!showOfflineSubscriptionActivation)
                      }}
                    >
                      {showOfflineSubscriptionActivation ? 'Close' : 'Activate Premium Features'}
                    </Button>

                    {showOfflineSubscriptionActivation && (
                      <OfflineSubscription
                        application={application}
                        onSuccess={() => {
                          setIsAPremiumUser(true)
                          setShowOfflineSubscriptionActivation(false)
                        }}
                      />
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </>
  )
}

export default HomeServerSettings
