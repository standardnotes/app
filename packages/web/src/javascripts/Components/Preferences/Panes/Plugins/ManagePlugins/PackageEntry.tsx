import { FunctionComponent, useState } from 'react'
import { ComponentInterface, ComponentMutator } from '@standardnotes/snjs'
import PluginEntrySubInfo from './PackageEntrySubInfo'
import PreferencesSegment from '../../../PreferencesComponents/PreferencesSegment'
import { WebApplication } from '@/Application/WebApplication'
import { AnyPackageType } from '../AnyPackageType'

interface PackageEntryProps {
  application: WebApplication
  plugin: AnyPackageType
  first: boolean
  latestVersion: string | undefined
  toggleActivate?: (extension: AnyPackageType) => void
}

const PackageEntry: FunctionComponent<PackageEntryProps> = ({ application, plugin }) => {
  const [_, setPluginName] = useState(plugin.displayName)

  const changeExtensionName = (newName: string) => {
    setPluginName(newName)
    application.changeAndSaveItem
      .execute<ComponentMutator>(plugin, (mutator) => {
        mutator.name = newName
      })
      .then((result) => {
        const component = result.getValue() as ComponentInterface
        setPluginName(component.name)
      })
      .catch(console.error)
  }

  return (
    <PreferencesSegment>
      <PluginEntrySubInfo plugin={plugin} changeName={changeExtensionName} />
    </PreferencesSegment>
  )
}

export default PackageEntry
