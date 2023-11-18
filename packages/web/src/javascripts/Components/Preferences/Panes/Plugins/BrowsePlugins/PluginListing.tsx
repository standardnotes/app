import { useApplication } from '@/Components/ApplicationProvider'
import Button from '@/Components/Button/Button'
import { Subtitle, Text } from '@/Components/Preferences/PreferencesComponents/Content'
import { PluginListing } from '@standardnotes/ui-services'
import { FunctionComponent, useCallback } from 'react'

type Props = {
  plugin: PluginListing
}

const PluginListing: FunctionComponent<Props> = ({ plugin }) => {
  const application = useApplication()

  const install = useCallback(async () => {
    const result = await application.pluginsService.installPlugin(plugin)
    if (!result) {
      void application.alerts.alertV2({ text: 'Failed to install plugin' })
    } else {
      void application.alerts.alertV2({ text: `${result.name} has been successfully installed.` })
    }
  }, [application, plugin])

  return (
    <div className="align-center my-2.5 flex items-center justify-between md:items-center">
      <div>
        <Subtitle className="mr-auto overflow-hidden text-ellipsis text-sm">{plugin.name}</Subtitle>
        <Text className="text-success">{plugin.publisher}</Text>
      </div>

      <Button small className="cursor-pointer" onClick={install}>
        Install
      </Button>
    </div>
  )
}

export default PluginListing
