import { Subtitle, Text, Title } from '@/Components/Preferences/PreferencesComponents/Content'
import PreferencesPane from '../../PreferencesComponents/PreferencesPane'
import PreferencesGroup from '../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../PreferencesComponents/PreferencesSegment'
import { useApplication } from '@/Components/ApplicationProvider'
import Button from '@/Components/Button/Button'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import HorizontalSeparator from '@/Components/Shared/HorizontalSeparator'
import { HomeServerStatus } from '@standardnotes/snjs'
import AccountMigration from './AccountMigration'

const HomeServer = () => {
  const application = useApplication()
  const desktopDevice = application.desktopDevice
  const [status, setStatus] = useState<HomeServerStatus>()
  const [showLogs, setShowLogs] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const logsTextarea = useRef<HTMLTextAreaElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)

  const refreshStatus = useCallback(async () => {
    if (desktopDevice) {
      const result = await desktopDevice.serverStatus()
      setStatus(result)
    }
  }, [desktopDevice])

  useEffect(() => {
    void refreshStatus()
  }, [refreshStatus])

  useEffect(() => {
    if (showLogs) {
      desktopDevice?.listenOnServerLogs((data: Buffer) => {
        setLogs((logs) => [...logs, new TextDecoder().decode(data)])
      })
    }
  }, [showLogs, desktopDevice])

  const handleShowLogs = () => {
    if (!showLogs) {
      desktopDevice?.stopListeningOnServerLogs()
    }

    setShowLogs(!showLogs)
  }

  const handleStartServer = useCallback(async () => {
    await desktopDevice?.startServer()
    await refreshStatus()
  }, [refreshStatus, desktopDevice])

  const handleStopServer = useCallback(async () => {
    await desktopDevice?.stopServer()
    await refreshStatus()
  }, [refreshStatus, desktopDevice])

  const handleRestartServer = useCallback(async () => {
    await desktopDevice?.stopServer()
    await desktopDevice?.startServer()
    await refreshStatus()
  }, [refreshStatus, desktopDevice])

  const clearLogs = () => {
    setLogs([])
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
    <PreferencesPane>
      {desktopDevice && (
        <PreferencesGroup>
          <PreferencesSegment>
            <Title>Home Server</Title>
            {status ? getStatusString() : <Text>Status unavailable</Text>}
            <div className="mt-3 flex flex-row flex-wrap gap-3">
              <Button disabled={status?.status === 'on'} label="Start" onClick={handleStartServer} />
              <Button disabled={status?.status === 'off'} label="Stop" onClick={handleStopServer} />
              <Button label="Restart" onClick={handleRestartServer} />
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
                <Button label="Clear" onClick={() => clearLogs()} />
              </div>
            )}
            <div className="h-2 w-full" />
          </PreferencesSegment>
        </PreferencesGroup>
      )}

      <PreferencesGroup>
        <Title>Local Access</Title>
        {status?.status === 'on' ? (
          <>
            <Subtitle>
              Your home server can be accessed from any device connected to the same network as this computer using this
              url:
            </Subtitle>
            <Text className="mt-3">
              <a target="_blank" className="font-bold text-info" href={status.url}>
                {status.url}
              </a>
            </Text>
          </>
        ) : (
          <Subtitle>Start your server to view local connection information.</Subtitle>
        )}
      </PreferencesGroup>

      <PreferencesGroup>
        <Title>Remote Access</Title>
        <Subtitle>Accessing your home server while on the go is easy and secure with Tailscale.</Subtitle>
        <ol className="mt-3 ml-3 list-outside list-decimal">
          <li>
            Register on{' '}
            <a className="text-info" href="https://tailscale.com/">
              Tailscale.com
            </a>{' '}
            for free.
          </li>
          <li className="mt-2">
            Download Tailscale on this computer and complete the Tailscale setup wizard until you are presented with the
            final IP address of your server. It should start with something like 100.xxx...
          </li>
          <li className="mt-2">Download Tailscale on your mobile device and sign into your Tailscale account.</li>
        </ol>
      </PreferencesGroup>

      <PreferencesGroup>
        <Title>Backing Up Your Data</Title>
        <Subtitle>
          For automatic backups, you can place your server's data inside of a synced cloud folder, like Dropbox,
          Tresorit, or iCloud Drive.
        </Subtitle>
        <ol className="mt-3 ml-3 list-outside list-decimal">
          <li>
            Change your server's data location by selecting "Change Data Location" in the Home Server section above.
          </li>
          <li className="mt-2">Select a cloud drive to store your server's data in.</li>
          <li className="mt-2">Restart your home server.</li>
        </ol>
        <Text className="mt-3">
          Your Standard Notes data is always end-to-end encrypted on disk, so your cloud provider will not be able to
          read your notes or files.
        </Text>
      </PreferencesGroup>

      <AccountMigration />
    </PreferencesPane>
  )
}

export default HomeServer
