import { TabButton } from './TabButton'
import { useState } from 'react'
import { ServerType } from './ServerType'
import DecoratedInput from '@/Components/Input/DecoratedInput'
import Icon from '@/Components/Icon/Icon'
import { useApplication } from '@/Components/ApplicationProvider'
import { isDesktopApplication } from '@/Utils'

type Props = {
  customServerAddress?: string
  handleCustomServerAddressChange: (value: string) => void
  className?: string
}

const ServerPicker = ({ className, customServerAddress, handleCustomServerAddressChange }: Props) => {
  const DEFAULT_API_HOST = 'https://api.standardnotes.com'

  const application = useApplication()

  const [currentType, setCurrentType] = useState<ServerType>('standard')

  const selectTab = async (type: ServerType) => {
    setCurrentType(type)
    if (type === 'standard') {
      handleCustomServerAddressChange(DEFAULT_API_HOST)
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

  return (
    <div className={`flex h-full flex-grow flex-col ${className}`}>
      <div className="flex">Sync Server:</div>
      <div className="flex">
        <TabButton label="Standard" type={'standard'} currentType={currentType} selectTab={selectTab} />
        <TabButton label="Custom" type={'custom'} currentType={currentType} selectTab={selectTab} />
        {isDesktopApplication() && (
          <TabButton label="Home Server" type={'home server'} currentType={currentType} selectTab={selectTab} />
        )}
      </div>
      {currentType === 'custom' && (
        <DecoratedInput
          type="text"
          left={[<Icon type="server" className="text-neutral" />]}
          placeholder={DEFAULT_API_HOST}
          value={customServerAddress}
          onChange={handleCustomServerAddressChange}
        />
      )}
    </div>
  )
}

export default ServerPicker
