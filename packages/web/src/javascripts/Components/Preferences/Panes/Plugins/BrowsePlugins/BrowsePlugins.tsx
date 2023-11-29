import { FunctionComponent, useCallback, useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import PreferencesSegment from '../../../PreferencesComponents/PreferencesSegment'
import { useApplication } from '@/Components/ApplicationProvider'
import { PluginsList } from '@standardnotes/ui-services'
import PluginRowView from './PluginRowView'
import HorizontalSeparator from '@/Components/Shared/HorizontalSeparator'
import { ContentType } from '@standardnotes/snjs'
import { Text, Title } from '@/Components/Preferences/PreferencesComponents/Content'
import { PreferencesPremiumOverlay } from '@/Components/Preferences/PremiumOverlay'

const BrowsePlugins: FunctionComponent = () => {
  const application = useApplication()

  const [plugins, setPlugins] = useState<PluginsList | null>(null)

  const reloadPlugins = useCallback(() => {
    application.pluginsService.getInstallablePlugins().then(setPlugins).catch(console.error)
  }, [application])

  useEffect(() => {
    reloadPlugins()
  }, [reloadPlugins])

  useEffect(() => {
    application.items.streamItems([ContentType.TYPES.Component, ContentType.TYPES.Theme], reloadPlugins)
  }, [application, reloadPlugins])

  const hasSubscription = application.hasValidFirstPartySubscription()

  return (
    <div className="relative">
      <PreferencesSegment>
        <Title>Browse Plugins</Title>
        <Text className="text-neutral">
          Plugins run in a secure sandbox and can only access data you allow it. Note types allow specialized editing
          experiences, but in most cases, the <strong>built-in Super note type</strong> can encapsulate any
          functionality found in plugins.
        </Text>

        {!plugins && (
          <div className="mb-3 mt-5 flex h-full w-full items-center">
            <span className="w-full font-bold">Loading...</span>
          </div>
        )}

        <div className="mt-2">
          {plugins?.map((plugin, index) => {
            return (
              <div key={plugin.name}>
                <PluginRowView plugin={plugin} />
                {index < plugins.length - 1 && <HorizontalSeparator />}
              </div>
            )
          })}
        </div>
      </PreferencesSegment>
      <HorizontalSeparator />
      <Text className="mt-4 text-danger">
        Plugins may not be actively maintained. Standard Notes cannot attest to the quality or user experience of these
        plugins, and is not responsible for any data loss that may arise from their use.
      </Text>

      {!hasSubscription && <PreferencesPremiumOverlay />}
    </div>
  )
}

export default observer(BrowsePlugins)
