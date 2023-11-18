import { useApplication } from '@/Components/ApplicationProvider'
import Button from '@/Components/Button/Button'
import { Text } from '@/Components/Preferences/PreferencesComponents/Content'
import { PluginListing } from '@standardnotes/ui-services'
import { FunctionComponent, useCallback } from 'react'

type Props = {
  plugin: PluginListing
}

const PluginListing: FunctionComponent<Props> = ({ plugin }) => {
  const application = useApplication()

  const install = useCallback(() => {
    const result = application.pluginsService.installPlugin(plugin)
    if (!result) {
      void application.alerts.alertV2({ text: 'Failed to install plugin' })
    }
  }, [application, plugin])

  return (
    <div className="flex flex-row flex-wrap items-center gap-3">
      <Text className="wrap mb-2">{plugin.name}</Text>
      <Text className="wrap mb-2">{plugin.description}</Text>

      <Button small className="cursor-pointer" onClick={install}>
        Install
      </Button>
    </div>
  )
}

export default PluginListing
