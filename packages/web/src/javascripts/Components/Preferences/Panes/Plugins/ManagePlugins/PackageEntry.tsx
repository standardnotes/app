import { FunctionComponent } from 'react'
import PluginEntrySubInfo from './PackageEntrySubInfo'
import PreferencesSegment from '../../../PreferencesComponents/PreferencesSegment'
import { AnyPackageType } from '../AnyPackageType'

interface PackageEntryProps {
  plugin: AnyPackageType
  latestVersion: string | undefined
  toggleActivate?: (extension: AnyPackageType) => void
}

const PackageEntry: FunctionComponent<PackageEntryProps> = ({ plugin }) => {
  return (
    <PreferencesSegment>
      <PluginEntrySubInfo plugin={plugin} />
    </PreferencesSegment>
  )
}

export default PackageEntry
