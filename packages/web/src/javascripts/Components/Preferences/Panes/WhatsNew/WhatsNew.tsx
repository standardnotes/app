import PreferencesPane from '../../PreferencesComponents/PreferencesPane'
import PreferencesGroup from '../../PreferencesComponents/PreferencesGroup'
import { WebApplication } from '@/Application/Application'
import { useEffect, useState } from 'react'
import { Changelog } from '@standardnotes/ui-services'
import { Subtitle, TitleLink } from '@/Components/Preferences/PreferencesComponents/Content'
import HorizontalSeparator from '@/Components/Shared/HorizontalSeparator'
import { getSectionItems } from './getSectionItems'

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

  useEffect(() => {
    void application.changelogService.getChangelog().then(setChangelog)
  }, [application])

  if (!changelog) {
    return <div>Loading...</div>
  }

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

        return (
          <PreferencesGroup>
            <div key={version.version}>
              <TitleLink link={application.changelogService.getDownloadsUrl(version.version)} className="mb-3 flex">
                {version.version}
                {version.version === appVersion && (
                  <div className="ml-2 rounded bg-info px-2 text-[10px] font-bold text-info-contrast">Your Version</div>
                )}
                {index === 0 && (
                  <div className="ml-2 rounded bg-success px-2 text-[10px] font-bold text-success-contrast">
                    Latest Version
                  </div>
                )}
              </TitleLink>
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
