import { ButtonType, ContentType, SNComponent } from '@standardnotes/snjs'
import Button from '@/Components/Button/Button'
import DecoratedInput from '@/Components/Input/DecoratedInput'
import { WebApplication } from '@/Application/Application'
import { FunctionComponent, useEffect, useRef, useState } from 'react'
import { Subtitle } from '@/Components/Preferences/PreferencesComponents/Content'
import { observer } from 'mobx-react-lite'
import { PackageProvider } from './Provider/PackageProvider'
import PackageEntry from './PackageEntry'
import ConfirmCustomPackage from './ConfirmCustomPackage'
import { AnyPackageType } from './Types/AnyPackageType'
import PreferencesSegment from '../../../../PreferencesComponents/PreferencesSegment'

const loadExtensions = (application: WebApplication) =>
  application.items.getItems([
    ContentType.ActionsExtension,
    ContentType.Component,
    ContentType.Theme,
  ]) as AnyPackageType[]

type Props = {
  application: WebApplication
  extensionsLatestVersions: PackageProvider
  className?: string
}

const PackagesPreferencesSection: FunctionComponent<Props> = ({
  application,
  extensionsLatestVersions,
  className = '',
}) => {
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
    application.alertService
      .confirm(
        'Are you sure you want to uninstall this extension? Note that extensions managed by your subscription will automatically be re-installed on application restart.',
        'Uninstall Extension?',
        'Uninstall',
        ButtonType.Danger,
        'Cancel',
      )
      .then(async (shouldRemove: boolean) => {
        if (shouldRemove) {
          await application.mutator.deleteItem(extension)
          setExtensions(loadExtensions(application))
        }
      })
      .catch((err: string) => {
        application.alertService.alert(err).catch(console.error)
      })
  }

  const submitExtensionUrl = async (url: string) => {
    const component = await application.features.downloadExternalFeature(url)
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

    if (extension instanceof SNComponent) {
      return !['modal', 'rooms'].includes(extension.area)
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
                latestVersion={extensionsLatestVersions.getVersion(extension)}
                first={i === 0}
                uninstall={uninstallExtension}
              />
            ))}
        </div>
      )}

      <div>
        {!confirmableExtension && (
          <PreferencesSegment>
            <Subtitle>Install External Package</Subtitle>
            <div className={'mt-2'}>
              <DecoratedInput
                placeholder={'Enter Package URL'}
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
            <ConfirmCustomPackage component={confirmableExtension} callback={handleConfirmExtensionSubmit} />
            <div ref={confirmableEnd} />
          </PreferencesSegment>
        )}
      </div>
    </div>
  )
}

export default observer(PackagesPreferencesSection)
