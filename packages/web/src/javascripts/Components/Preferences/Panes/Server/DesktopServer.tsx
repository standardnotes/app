import { Text, Title } from '@/Components/Preferences/PreferencesComponents/Content'
import PreferencesPane from '../../PreferencesComponents/PreferencesPane'
import PreferencesGroup from '../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../PreferencesComponents/PreferencesSegment'
import { useApplication } from '@/Components/ApplicationProvider'
import Button from '@/Components/Button/Button'
import { useCallback, useState } from 'react'

const DesktopServer = () => {
  const application = useApplication()
  const desktopDevice = application.desktopDevice
  const [status, setStatus] = useState('')

  const refreshStatus = useCallback(async () => {
    if (desktopDevice) {
      const result = await desktopDevice.desktopServerStatus()
      setStatus(result)
    }
  }, [desktopDevice])

  void refreshStatus()

  if (!desktopDevice) {
    return (
      <PreferencesPane>
        <PreferencesGroup>
          <PreferencesSegment>
            <Title>Desktop Server</Title>
            <Text>To configure your desktop server, use the Standard Notes desktop application.</Text>
            <div className="h-2 w-full" />
          </PreferencesSegment>
        </PreferencesGroup>
      </PreferencesPane>
    )
  }

  return (
    <PreferencesPane>
      <PreferencesGroup>
        <PreferencesSegment>
          <Title>Server</Title>
          <Text>Status: {status}</Text>
          <Button label="Install" onClick={() => desktopDevice.desktopServerInstall()} />
          <Button label="Start" onClick={() => desktopDevice.desktopServerStart()} />
          <Button label="Stop" onClick={() => desktopDevice.desktopServerStop()} />
          <Button label="Restart" onClick={() => desktopDevice.desktopServerRestart()} />
          <Button label="Open Data" onClick={() => desktopDevice.desktopServerOpenDataDirectory()} />
          <Button label="Refresh Status" onClick={() => refreshStatus()} />

          <div className="h-2 w-full" />
        </PreferencesSegment>
      </PreferencesGroup>
    </PreferencesPane>
  )
}

export default DesktopServer
