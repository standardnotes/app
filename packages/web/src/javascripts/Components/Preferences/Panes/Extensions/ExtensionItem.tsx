import { FunctionComponent, useState } from 'react'
import { ComponentMutator, SNComponent } from '@standardnotes/snjs'
import { SubtitleLight } from '@/Components/Preferences/PreferencesComponents/Content'
import Switch from '@/Components/Switch/Switch'
import Button from '@/Components/Button/Button'
import ExtensionInfoCell from './ExtensionInfoCell'
import { ExtensionItemProps } from './ExtensionItemProps'
import PreferencesSegment from '../../PreferencesComponents/PreferencesSegment'

const UseHosted: FunctionComponent<{
  offlineOnly: boolean
  toggleOfflineOnly: () => void
}> = ({ offlineOnly, toggleOfflineOnly }) => (
  <div className="flex flex-row">
    <SubtitleLight className="flex-grow">Use hosted when local is unavailable</SubtitleLight>
    <Switch onChange={toggleOfflineOnly} checked={!offlineOnly} />
  </div>
)

const ExtensionItem: FunctionComponent<ExtensionItemProps> = ({ application, extension, uninstall }) => {
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

  const isThirParty = 'identifier' in extension && application.features.isThirdPartyFeature(extension.identifier)

  return (
    <PreferencesSegment classes={'mb-5'}>
      <ExtensionInfoCell isThirdParty={isThirParty} extensionName={extensionName} changeName={changeExtensionName} />

      <div className="min-h-2" />

      {isThirParty && localInstallable && <UseHosted offlineOnly={offlineOnly} toggleOfflineOnly={toggleOfflineOnly} />}

      <div className="min-h-2" />
      {isThirParty && (
        <div className="flex flex-row">
          <Button className="min-w-20" variant="normal" label={'Uninstall'} onClick={() => uninstall(extension)} />
        </div>
      )}
    </PreferencesSegment>
  )
}

export default ExtensionItem
