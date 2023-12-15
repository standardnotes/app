import { TabButton } from './TabButton'
import { useState } from 'react'
import { ServerType } from './ServerType'
import DecoratedInput from '@/Components/Input/DecoratedInput'
import Icon from '@/Components/Icon/Icon'

type Props = {
  customServerAddress?: string
  handleCustomServerAddressChange?: (value: string) => void
  className?: string
}

const ServerPicker = ({ className, customServerAddress, handleCustomServerAddressChange }: Props) => {
  const [currentType, setCurrentType] = useState<ServerType>('standard')

  const selectTab = (type: ServerType) => {
    setCurrentType(type)
  }

  return (
    <div className={`flex h-full flex-grow flex-col ${className}`}>
      <div className="flex">Sync Server:</div>
      <div className="flex">
        <TabButton label="Standard" type={'standard'} currentType={currentType} selectTab={selectTab} />
        <TabButton label="Custom" type={'custom'} currentType={currentType} selectTab={selectTab} />
        <TabButton label="Home Server" type={'home server'} currentType={currentType} selectTab={selectTab} />
      </div>
      {currentType === 'custom' && (
        <DecoratedInput
          type="text"
          left={[<Icon type="server" className="text-neutral" />]}
          placeholder="https://api.standardnotes.com"
          value={customServerAddress}
          onChange={handleCustomServerAddressChange}
        />
      )}
    </div>
  )
}

export default ServerPicker
