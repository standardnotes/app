import { useApplication } from '@/Components/ApplicationProvider'
import Button from '@/Components/Button/Button'
import { Text } from '@/Components/Preferences/PreferencesComponents/Content'
import { ContentType } from '@standardnotes/snjs'
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

  const pluginType = plugin.content_type === ContentType.TYPES.Theme ? 'theme' : 'note type'

  return (
    <div className="align-center my-2.5 flex items-center justify-between md:items-center">
      <div className="mr-5">
        <h4 className="text-info m-0 mr-auto overflow-hidden text-ellipsis text-base text-sm font-bold lg:text-sm">
          {plugin.name}
        </h4>
        <Text className="mb-2">
          A <strong>{pluginType}</strong> by {plugin.publisher}
        </Text>
        {plugin.description && <Text className="text-neutral">{plugin.description}</Text>}
      </div>

      <Button small className="cursor-pointer" onClick={install}>
        Install
      </Button>
    </div>
  )
}

export default PluginListing
