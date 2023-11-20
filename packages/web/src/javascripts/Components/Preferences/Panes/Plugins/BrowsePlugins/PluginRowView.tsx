import { useApplication } from '@/Components/ApplicationProvider'
import Button from '@/Components/Button/Button'
import { SmallText, Subtitle } from '@/Components/Preferences/PreferencesComponents/Content'
import { ContentType } from '@standardnotes/snjs'
import { PluginListing } from '@standardnotes/ui-services'
import { FunctionComponent, useCallback } from 'react'

type Props = {
  plugin: PluginListing
}

const PluginRowView: FunctionComponent<Props> = ({ plugin }) => {
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

  const hasSubscription = application.hasValidFirstPartySubscription()

  return (
    <div className="align-center my-2.5 flex items-center justify-between md:items-center">
      <div className="mr-5">
        <Subtitle className="mb-0 text-info">{plugin.name}</Subtitle>
        <SmallText className="mb-1">
          A <strong>{pluginType}</strong> by {plugin.publisher}
        </SmallText>
        {plugin.description && <SmallText className="text-neutral">{plugin.description}</SmallText>}
      </div>

      <Button disabled={!hasSubscription} small className="cursor-pointer" onClick={install}>
        Install
      </Button>
    </div>
  )
}

export default PluginRowView
