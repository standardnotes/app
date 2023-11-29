import { ContentType } from '@standardnotes/snjs'
import { WebApplication } from '@/Application/WebApplication'
import { FunctionComponent, useCallback, useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { PackageProvider } from '../PackageProvider'
import PackageEntry from './PackageEntry'
import { AnyPackageType } from '../AnyPackageType'
import { useApplication } from '@/Components/ApplicationProvider'

const loadPlugins = (application: WebApplication) =>
  application.items.getItems([
    ContentType.TYPES.ActionsExtension,
    ContentType.TYPES.Component,
    ContentType.TYPES.Theme,
  ]) as AnyPackageType[]

type Props = {
  pluginsLatestVersions: PackageProvider
  className?: string
}

const ManagePlugins: FunctionComponent<Props> = ({ pluginsLatestVersions, className = '' }) => {
  const application = useApplication()

  const [plugins, setPlugins] = useState(loadPlugins(application))

  const reloadInstalledPlugins = useCallback(() => {
    const plugins = application.items.getItems([
      ContentType.TYPES.ActionsExtension,
      ContentType.TYPES.Component,
      ContentType.TYPES.Theme,
    ]) as AnyPackageType[]
    setPlugins(plugins)
  }, [application.items])

  useEffect(() => {
    application.items.streamItems(
      [ContentType.TYPES.Component, ContentType.TYPES.Theme, ContentType.TYPES.ActionsExtension],
      reloadInstalledPlugins,
    )
  }, [application, reloadInstalledPlugins])

  const visiblePlugins = plugins.filter((extension) => {
    const hasPackageInfo = extension.package_info != undefined

    if (!hasPackageInfo) {
      return false
    }

    return true
  })

  return (
    <div className={className}>
      {visiblePlugins.length === 0 && <div className="text-neutral">No plugins installed.</div>}
      {visiblePlugins.length > 0 && (
        <div className="divide-y divide-border">
          {visiblePlugins
            .sort((e1, e2) => e1.displayName?.toLowerCase().localeCompare(e2.displayName?.toLowerCase()))
            .map((extension) => {
              return (
                <PackageEntry
                  plugin={extension}
                  latestVersion={pluginsLatestVersions.getVersion(extension)}
                  key={extension.uuid}
                />
              )
            })}
        </div>
      )}
    </div>
  )
}

export default observer(ManagePlugins)
