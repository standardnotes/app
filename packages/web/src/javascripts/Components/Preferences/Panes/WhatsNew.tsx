import PreferencesPane from '../PreferencesComponents/PreferencesPane'
import PreferencesGroup from '../PreferencesComponents/PreferencesGroup'
import { WebApplication } from '@/Application/Application'
import { useEffect, useState } from 'react'
import { Changelog } from '@standardnotes/ui-services'

const WhatsNew = ({ application }: { application: WebApplication }) => {
  const [changelog, setChangelog] = useState<Changelog | null>(null)

  useEffect(() => {
    void application.changelogService.getChangelog().then(setChangelog)
  }, [application])

  if (!changelog) {
    return <div>Loading...</div>
  }

  return (
    <PreferencesPane>
      <PreferencesGroup>
        {changelog.versions.map((version) => (
          <div key={version.version}>
            <h3>{version.version}</h3>
            <ul>
              {Object.keys(version.parsed).map((key) => {
                const change = version.parsed[key]
                return <li>{change}</li>
              })}
            </ul>
          </div>
        ))}
      </PreferencesGroup>
    </PreferencesPane>
  )
}

export default WhatsNew
