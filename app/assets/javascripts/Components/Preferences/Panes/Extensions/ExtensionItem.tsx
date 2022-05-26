import { FunctionComponent, useState } from 'react'
import { SNComponent } from '@standardnotes/snjs'
import { SubtitleLight } from '@/Components/Preferences/PreferencesComponents/Content'
import Switch from '@/Components/Switch/Switch'
import Button from '@/Components/Button/Button'
import ExtensionInfoCell from './ExtensionInfoCell'
import { ExtensionItemProps } from './ExtensionItemProps'
import PreferencesSegment from '../../PreferencesComponents/PreferencesSegment'

const UseHosted: FunctionComponent<{
  offlineOnly: boolean
  toggleOfllineOnly: () => void
}> = ({ offlineOnly, toggleOfllineOnly }) => (
  <div className="flex flex-row">
    <SubtitleLight className="flex-grow">Use hosted when local is unavailable</SubtitleLight>
    <Switch onChange={toggleOfllineOnly} checked={!offlineOnly} />
  </div>
)

const ExtensionItem: FunctionComponent<ExtensionItemProps> = ({ application, extension, uninstall }) => {
  const [offlineOnly, setOfflineOnly] = useState(extension instanceof SNComponent ? extension.offlineOnly : false)
  const [extensionName, setExtensionName] = useState(extension.displayName)

  const toggleOffllineOnly = () => {
    const newOfflineOnly = !offlineOnly
    setOfflineOnly(newOfflineOnly)
    application.mutator
      .changeAndSaveItem(extension, (m: any) => {
        if (m.content == undefined) {
          m.content = {}
        }
        m.content.offlineOnly = newOfflineOnly
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
      .changeAndSaveItem(extension, (m: any) => {
        if (m.content == undefined) {
          m.content = {}
        }
        m.content.name = newName
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

      {isThirParty && localInstallable && (
        <UseHosted offlineOnly={offlineOnly} toggleOfllineOnly={toggleOffllineOnly} />
      )}

      <>
        <div className="min-h-2" />
        <div className="flex flex-row">
          <Button
            className="min-w-20"
            variant="normal"
            label={isThirParty ? 'Uninstall' : 'Reset'}
            onClick={() => uninstall(extension)}
          />
        </div>
      </>
    </PreferencesSegment>
  )
}

export default ExtensionItem
