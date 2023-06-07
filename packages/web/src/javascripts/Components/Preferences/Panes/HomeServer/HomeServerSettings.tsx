import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import Button from '@/Components/Button/Button'
import { Text } from '@/Components/Preferences/PreferencesComponents/Content'
import HorizontalSeparator from '@/Components/Shared/HorizontalSeparator'
import { useApplication } from '@/Components/ApplicationProvider'
import { HomeServerStatus } from '@standardnotes/snjs'
import EncryptionStatusItem from '../Security/EncryptionStatusItem'
import Icon from '@/Components/Icon/Icon'

const HomeServerSettings = () => {
  const application = useApplication()
  const desktopDevice = application.desktopDevice
  const homeServerService = application.homeServer

  const logsTextarea = useRef<HTMLTextAreaElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [showLogs, setShowLogs] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [status, setStatus] = useState<HomeServerStatus>()
  const [homeServerDataLocation, setHomeServerDataLocation] = useState(homeServerService.getHomeServerDataLocation())

  const changeHomeServerDataLocation = useCallback(async () => {
    await desktopDevice?.stopServer()
    const newLocation = await homeServerService.changeHomeServerDataLocation()
    setHomeServerDataLocation(newLocation)
    await desktopDevice?.startServer()
  }, [homeServerService, desktopDevice])

  const openHomeServerDataLocation = useCallback(async () => {
    await homeServerService.openHomeServerDataLocation()
  }, [homeServerService])

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
          <Button label="Clear" onClick={() => clearLogs()} />
        </div>
      )}
      <div className="h-2 w-full" />
    </div>
  )
}

export default HomeServerSettings
