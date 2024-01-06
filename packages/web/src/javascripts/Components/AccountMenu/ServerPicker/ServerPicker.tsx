import { useCallback, useEffect, useMemo, useState } from 'react'
import { ServerType } from './ServerType'
import DecoratedInput from '@/Components/Input/DecoratedInput'
import Icon from '@/Components/Icon/Icon'
import { useApplication } from '@/Components/ApplicationProvider'
import { isDesktopApplication } from '@/Utils'
import RadioButtonGroup from '@/Components/RadioButtonGroup/RadioButtonGroup'
import { DefaultHost } from '@standardnotes/snjs'

type Props = {
  className?: string
}

const ServerPicker = ({ className }: Props) => {
  const application = useApplication()

  const [currentType, setCurrentType] = useState<ServerType>('standard')

  const { server, setServer } = application.accountMenuController

  const determineServerType = useCallback(async () => {
    const homeServerUrl = await application.homeServer?.getHomeServerUrl()
    if (homeServerUrl && server === homeServerUrl) {
      setCurrentType('home server')
    } else if (server === DefaultHost.Api) {
      setCurrentType('standard')
    } else {
      setCurrentType('custom')
    }
  }, [application.homeServer, server])

  const handleSyncServerChange = useCallback(
    (server: string, websocketUrl?: string) => {
      setServer(server)
      void determineServerType()
      application.setCustomHost(server, websocketUrl).catch(console.error)
    },
    [application, setServer, determineServerType],
  )

  useEffect(() => {
    void determineServerType()
  }, [application, server, determineServerType])

  const selectTab = async (type: ServerType) => {
    setCurrentType(type)
    if (type === 'standard') {
      handleSyncServerChange(DefaultHost.Api, DefaultHost.WebSocket)
    } else if (type === 'home server') {
      if (!application.homeServer) {
        application.alerts
          .alert('Home server is not running. Please open the prefences and home server tab to start it.')
          .catch(console.error)

        return
      }

      const homeServerUrl = await application.homeServer.getHomeServerUrl()
      if (!homeServerUrl) {
        application.alerts
          .alert('Home server is not running. Please open the prefences and home server tab to start it.')
          .catch(console.error)

        return
      }

      handleSyncServerChange(homeServerUrl)
    }
  }

  const options = useMemo(
    () =>
      [
        { label: 'Default', value: 'standard' },
        { label: 'Custom', value: 'custom' },
      ].concat(isDesktopApplication() ? [{ label: 'Home Server', value: 'home server' }] : []) as {
        label: string
        value: ServerType
      }[],
    [],
  )

  return (
    <div className={`flex h-full flex-grow flex-col px-3 pb-1.5 ${className}`}>
      <div className="mb-2 flex font-bold">Sync Server</div>
      <RadioButtonGroup value={currentType} items={options} onChange={selectTab} />
      {currentType === 'custom' && (
        <DecoratedInput
          className={{
            container: 'mt-1',
          }}
          type="text"
          left={[<Icon type="server" className="text-neutral" />]}
          placeholder={DefaultHost.Api}
          value={server}
          onChange={handleSyncServerChange}
        />
      )}
    </div>
  )
}

export default ServerPicker
