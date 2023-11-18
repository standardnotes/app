import { FunctionComponent, useCallback, useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import PreferencesSegment from '../../../PreferencesComponents/PreferencesSegment'
import { useApplication } from '@/Components/ApplicationProvider'
import { PluginsList } from '@standardnotes/ui-services'
import PluginListing from './PluginListing'
import HorizontalSeparator from '@/Components/Shared/HorizontalSeparator'
import { ContentType } from '@standardnotes/snjs'

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

  return (
    <div>
      <PreferencesSegment>
        <div className="">
          {plugins?.map((plugin, index) => {
            return (
              <div key={plugin.name}>
                <PluginListing plugin={plugin} />
                {index < plugins.length - 1 && <HorizontalSeparator />}
              </div>
            )
          })}
        </div>
      </PreferencesSegment>
    </div>
  )
}

export default observer(BrowsePlugins)
