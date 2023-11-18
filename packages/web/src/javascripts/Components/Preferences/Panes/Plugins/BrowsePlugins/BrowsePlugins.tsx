import { FunctionComponent, useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import PreferencesSegment from '../../../PreferencesComponents/PreferencesSegment'
import { useApplication } from '@/Components/ApplicationProvider'
import { PluginsList } from '@standardnotes/ui-services'
import PluginListing from './PluginListing'

const BrowsePlugins: FunctionComponent = () => {
  const application = useApplication()

  const [plugins, setPlugins] = useState<PluginsList | null>(null)

  useEffect(() => {
    application.pluginsService.getPlugins().then(setPlugins).catch(console.error)
  }, [application])

  return (
    <div>
      <PreferencesSegment>
        {plugins?.map((plugin) => {
          return <PluginListing key={plugin.name} plugin={plugin} />
        })}
      </PreferencesSegment>
    </div>
  )
}

export default observer(BrowsePlugins)
