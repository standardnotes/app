import PreferencesPane from '../../PreferencesComponents/PreferencesPane'
import PreferencesGroup from '../../PreferencesComponents/PreferencesGroup'
import { WebApplication } from '@/Application/WebApplication'
import { useEffect, useMemo, useState } from 'react'
import { Changelog } from '@standardnotes/ui-services'
import { LinkButton, Subtitle, Title } from '@/Components/Preferences/PreferencesComponents/Content'
import HorizontalSeparator from '@/Components/Shared/HorizontalSeparator'
import { getSectionItems } from './getSectionItems'
import { isDesktopApplication } from '@/Utils'
import { compareSemVersions } from '@standardnotes/snjs'

const WhatsNewSection = ({ items, sectionName }: { items: string[] | undefined; sectionName: string }) => {
  if (!items) {
    return null
  }
  return (
    <div>
      <Subtitle>{sectionName}</Subtitle>
      <ul className="list-inside">
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

const WhatsNew = ({ application }: { application: WebApplication }) => {
  const [changelog, setChangelog] = useState<Changelog | null>(null)

  const appVersion = application.version
  const lastReadVersion = useMemo(() => application.changelogService.getLastReadVersion(), [application])

  useEffect(() => {
    application.changelogService.getChangelog().then(setChangelog).catch(console.error)
  }, [application])

  useEffect(() => {
    if (changelog) {
      application.changelogService.markAsRead()
    }
  }, [changelog, application])

  if (!changelog) {
    return (
      <div className="flex h-full w-full items-center text-center">
        <span className="w-full font-bold">Loading...</span>
      </div>
    )
  }

  const firstValidVersionIndex = changelog.versions.findIndex(
    (version) => version.version && (getSectionItems(version, 'Bug Fixes') || getSectionItems(version, 'Features')),
  )

  return (
    <PreferencesPane>
      {changelog.versions.map((version, index) => {
        const bugFixes = getSectionItems(version, 'Bug Fixes')
        const features = getSectionItems(version, 'Features')

        if (!bugFixes && !features) {
          return null
        }

        if (!version.version) {
          return null
        }

        const isUnreadVersion = lastReadVersion && compareSemVersions(version.version, lastReadVersion) > 0

        const isLatest = index === firstValidVersionIndex
        const isDesktopEnvironment = isDesktopApplication()
        const showDownloadLink = isDesktopEnvironment && isLatest

        return (
          <PreferencesGroup key={version.version}>
            <div key={version.version}>
              <div className="flex justify-between">
                <div className="flex items-start">
                  <Title className="mb-3 flex">{version.version}</Title>
                  {version.version === appVersion && (
                    <div className="ml-2 select-none rounded bg-info px-2 py-1 text-[10px] font-bold text-info-contrast">
                      Your Version
                    </div>
                  )}
                  {isLatest && (
                    <div className="ml-2 select-none rounded bg-success px-2 py-1 text-[10px] font-bold text-success-contrast">
                      Latest Version
                    </div>
                  )}
                  {isUnreadVersion && (
                    <div className="ml-2 select-none rounded bg-success px-2 py-1 text-[10px] font-bold text-success-contrast">
                      New
                    </div>
                  )}
                </div>
                {showDownloadLink && (
                  <LinkButton
                    label={'Open Downloads'}
                    link={application.changelogService.getDesktopDownloadsUrl(version.version)}
                    className="mb-3"
                  />
                )}
              </div>
              <WhatsNewSection sectionName="Features" items={features} />
              {features && bugFixes && <HorizontalSeparator classes="my-4" />}
              <WhatsNewSection sectionName="Bug Fixes" items={bugFixes} />
            </div>
          </PreferencesGroup>
        )
      })}
    </PreferencesPane>
  )
}

export default WhatsNew
