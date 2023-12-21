import { useMemo, useState } from 'react'
import { ServerType } from './ServerType'
import DecoratedInput from '@/Components/Input/DecoratedInput'
import Icon from '@/Components/Icon/Icon'
import { useApplication } from '@/Components/ApplicationProvider'
import { isDesktopApplication } from '@/Utils'
import RadioButtonGroup from '@/Components/RadioButtonGroup/RadioButtonGroup'
import { DefaultHost } from '@standardnotes/snjs'

type Props = {
  customServerAddress?: string
  handleCustomServerAddressChange: (value: string, websocketUrl?: string) => void
  className?: string
}

const ServerPicker = ({ className, customServerAddress, handleCustomServerAddressChange }: Props) => {
  const application = useApplication()

  const [currentType, setCurrentType] = useState<ServerType>('standard')

  const selectTab = async (type: ServerType) => {
    setCurrentType(type)
    if (type === 'standard') {
      handleCustomServerAddressChange(DefaultHost.Api, DefaultHost.WebSocket)
    }
    if (type === 'home server') {
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

      handleCustomServerAddressChange(homeServerUrl)
    }
  }

  const options = useMemo(
    () =>
      [
        { label: 'Standard', value: 'standard' },
        { label: 'Custom', value: 'custom' },
      ].concat(isDesktopApplication() ? [{ label: 'Home Server', value: 'home server' }] : []) as {
        label: string
        value: ServerType
      }[],
    [],
  )

  return (
    <div className={`flex h-full flex-grow flex-col ${className}`}>
      <div className="my-1 flex font-bold uppercase">Sync Server</div>
      <RadioButtonGroup value={currentType} items={options} onChange={selectTab} />
      {currentType === 'custom' && (
        <DecoratedInput
          className={{
            container: 'mt-1',
          }}
          type="text"
          left={[<Icon type="server" className="text-neutral" />]}
          placeholder={DefaultHost.Api}
          value={customServerAddress}
          onChange={handleCustomServerAddressChange}
        />
      )}
    </div>
  )
}

export default ServerPicker
