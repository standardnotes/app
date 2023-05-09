import { FunctionComponent, useState } from 'react'
import { ComponentMutator, SNComponent } from '@standardnotes/snjs'
import { SubtitleLight } from '@/Components/Preferences/PreferencesComponents/Content'
import Switch from '@/Components/Switch/Switch'
import Button from '@/Components/Button/Button'
import PackageEntrySubInfo from './PackageEntrySubInfo'
import PreferencesSegment from '../../../../PreferencesComponents/PreferencesSegment'
import { WebApplication } from '@/Application/WebApplication'
import { AnyPackageType } from './Types/AnyPackageType'

const UseHosted: FunctionComponent<{
  offlineOnly: boolean
  toggleOfflineOnly: () => void
}> = ({ offlineOnly, toggleOfflineOnly }) => (
  <div className="flex flex-row">
    <SubtitleLight className="flex-grow">Use hosted when local is unavailable</SubtitleLight>
    <Switch onChange={toggleOfflineOnly} checked={!offlineOnly} />
  </div>
)

interface PackageEntryProps {
  application: WebApplication
  extension: AnyPackageType
  first: boolean
  latestVersion: string | undefined
  uninstall: (extension: AnyPackageType) => void
  toggleActivate?: (extension: AnyPackageType) => void
}

const PackageEntry: FunctionComponent<PackageEntryProps> = ({ application, extension, uninstall }) => {
  const [offlineOnly, setOfflineOnly] = useState(extension instanceof SNComponent ? extension.offlineOnly : false)
  const [extensionName, setExtensionName] = useState(extension.displayName)

  const toggleOfflineOnly = () => {
    const newOfflineOnly = !offlineOnly
    setOfflineOnly(newOfflineOnly)
    application.mutator
      .changeAndSaveItem<ComponentMutator>(extension, (mutator) => {
        mutator.offlineOnly = newOfflineOnly
      })
      .then((item) => {
        const component = item as SNComponent
        setOfflineOnly(component.offlineOnly)
      })
      .catch((e) => {
        console.error(e)
      })
  }

  const changeExtensionName = (newName: string) => {
    setExtensionName(newName)
    application.mutator
      .changeAndSaveItem<ComponentMutator>(extension, (mutator) => {
        mutator.name = newName
      })
      .then((item) => {
        const component = item as SNComponent
        setExtensionName(component.name)
      })
      .catch(console.error)
  }

  const localInstallable = extension.package_info.download_url

  const isThirdParty = 'identifier' in extension && application.features.isThirdPartyFeature(extension.identifier)

  return (
    <PreferencesSegment classes={'mb-5'}>
      <PackageEntrySubInfo isThirdParty={isThirdParty} extensionName={extensionName} changeName={changeExtensionName} />

      <div className="my-1" />

      {isThirdParty && localInstallable && (
        <UseHosted offlineOnly={offlineOnly} toggleOfflineOnly={toggleOfflineOnly} />
      )}

      <div className="mt-2 flex flex-row">
        <Button className="min-w-20" label={'Uninstall'} onClick={() => uninstall(extension)} />
      </div>
    </PreferencesSegment>
  )
}

export default PackageEntry
