import { ButtonType, ContentType } from '@standardnotes/snjs'
import Button from '@/Components/Button/Button'
import DecoratedInput from '@/Components/Input/DecoratedInput'
import { WebApplication } from '@/Application/WebApplication'
import { FunctionComponent, useEffect, useRef, useState } from 'react'
import { Subtitle } from '@/Components/Preferences/PreferencesComponents/Content'
import { observer } from 'mobx-react-lite'
import { PackageProvider } from './PackageProvider'
import PackageEntry from './PackageEntry'
import ConfirmCustomPlugin from './ConfirmCustomPlugin'
import { AnyPackageType } from './AnyPackageType'
import PreferencesSegment from '../../PreferencesComponents/PreferencesSegment'
import { useApplication } from '@/Components/ApplicationProvider'

const loadExtensions = (application: WebApplication) =>
  application.items.getItems([
    ContentType.TYPES.ActionsExtension,
    ContentType.TYPES.Component,
    ContentType.TYPES.Theme,
  ]) as AnyPackageType[]

type Props = {
  pluginsLatestVersions: PackageProvider
  className?: string
}

const InstallCustomPlugin: FunctionComponent<Props> = ({ pluginsLatestVersions, className = '' }) => {
  const application = useApplication()

  const [customUrl, setCustomUrl] = useState('')
  const [confirmableExtension, setConfirmableExtension] = useState<AnyPackageType | undefined>(undefined)
  const [extensions, setExtensions] = useState(loadExtensions(application))

  const confirmableEnd = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (confirmableExtension) {
      confirmableEnd.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [confirmableExtension, confirmableEnd])

  const uninstallExtension = async (extension: AnyPackageType) => {
    application.alerts
      .confirm(
        'Are you sure you want to uninstall this plugin? Note that plugins managed by your subscription will automatically be re-installed on application restart.',
        'Uninstall Plugin?',
        'Uninstall',
        ButtonType.Danger,
        'Cancel',
      )
      .then(async (shouldRemove: boolean) => {
        if (shouldRemove) {
          await application.mutator.deleteItem(extension)
          void application.sync.sync()
          setExtensions(loadExtensions(application))
        }
      })
      .catch((err: string) => {
        application.alerts.alert(err).catch(console.error)
      })
  }

  const submitExtensionUrl = async (url: string) => {
    const component = await application.features.downloadRemoteThirdPartyFeature(url)
    if (component) {
      setConfirmableExtension(component)
    }
  }

  const handleConfirmExtensionSubmit = async (confirm: boolean) => {
    if (confirm) {
      confirmExtension().catch(console.error)
    }
    setConfirmableExtension(undefined)
    setCustomUrl('')
  }

  const confirmExtension = async () => {
    await application.mutator.insertItem(confirmableExtension as AnyPackageType)
    application.sync.sync().catch(console.error)
    setExtensions(loadExtensions(application))
  }

  const visibleExtensions = extensions.filter((extension) => {
    const hasPackageInfo = extension.package_info != undefined

    if (!hasPackageInfo) {
      return false
    }

    return true
  })

  return (
    <div className={className}>
      {visibleExtensions.length > 0 && (
        <div>
          {visibleExtensions
            .sort((e1, e2) => e1.displayName?.toLowerCase().localeCompare(e2.displayName?.toLowerCase()))
            .map((extension, i) => (
              <PackageEntry
                key={extension.uuid}
                application={application}
                extension={extension}
                latestVersion={pluginsLatestVersions.getVersion(extension)}
                first={i === 0}
                uninstall={uninstallExtension}
              />
            ))}
        </div>
      )}

      <div>
        {!confirmableExtension && (
          <PreferencesSegment>
            <Subtitle>Install External Plugin</Subtitle>
            <div className={'mt-2'}>
              <DecoratedInput
                placeholder={'Enter Plugin URL'}
                value={customUrl}
                onChange={(value) => {
                  setCustomUrl(value)
                }}
              />
            </div>
            <Button
              disabled={customUrl.length === 0}
              className="mt-3 min-w-20"
              primary
              label="Install"
              onClick={() => submitExtensionUrl(customUrl)}
            />
          </PreferencesSegment>
        )}
        {confirmableExtension && (
          <PreferencesSegment>
            <ConfirmCustomPlugin component={confirmableExtension} callback={handleConfirmExtensionSubmit} />
            <div ref={confirmableEnd} />
          </PreferencesSegment>
        )}
      </div>
    </div>
  )
}

export default observer(InstallCustomPlugin)
