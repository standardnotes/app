import { Environment } from '@standardnotes/models'
import { StorageServiceInterface, StorageKey } from '@standardnotes/services'
import { Changelog, ChangelogVersion } from './Changelog'
import { ChangelogLastReadVersionListener, ChangelogServiceInterface } from './ChangelogServiceInterface'
import { LegacyWebToDesktopVersionMapping } from './LegacyDesktopMapping'
import { LegacyWebToMobileVersionMapping } from './LegacyMobileMapping'

const WebChangelogUrl = 'https://raw.githubusercontent.com/standardnotes/app/main/packages/web/CHANGELOG.md.json'
const DesktopDownloadsUrlBase = 'https://github.com/standardnotes/app/releases/tag/%40standardnotes%2Fdesktop%40'

export class ChangelogService implements ChangelogServiceInterface {
  private changeLog?: Changelog
  private lastReadChangeListeners: ChangelogLastReadVersionListener[] = []

  constructor(
    private environment: Environment,
    private diskService: StorageServiceInterface,
  ) {}

  public addLastReadChangeListener(listener: ChangelogLastReadVersionListener) {
    this.lastReadChangeListeners.push(listener)

    return () => {
      this.lastReadChangeListeners = this.lastReadChangeListeners.filter((l) => l !== listener)
    }
  }

  private async performDownloadChangelog(): Promise<Changelog> {
    const response = await fetch(WebChangelogUrl)
    const changelog = await response.text()
    const parsedData = JSON.parse(changelog)
    return parsedData
  }

  public async getChangelog(): Promise<Changelog> {
    if (this.changeLog) {
      return this.changeLog
    }

    this.changeLog = await this.performDownloadChangelog()

    if (this.environment !== Environment.Web) {
      const legacyMapping = this.getLegacyMapping()

      this.changeLog.versions = this.changeLog.versions.map((versionRecord) => {
        const versionString = versionRecord.version || ''
        return {
          ...versionRecord,
          version: legacyMapping[versionString] || versionRecord.version,
        }
      })
    }

    return this.changeLog
  }

  public markAsRead(): void {
    if (!this.changeLog) {
      return
    }

    const version = this.changeLog.versions[0].version
    this.diskService.setValue(StorageKey.LastReadChangelogVersion, version)
    if (version) {
      this.lastReadChangeListeners.forEach((listener) => listener(version))
    }
  }

  public getLastReadVersion(): string | undefined {
    return this.diskService.getValue(StorageKey.LastReadChangelogVersion)
  }

  public async getVersions(): Promise<ChangelogVersion[]> {
    const changelog = await this.getChangelog()

    return changelog.versions
  }

  private getLegacyMapping(): Record<string, string> {
    return this.environment === Environment.Desktop
      ? LegacyWebToDesktopVersionMapping
      : this.environment === Environment.Mobile
      ? LegacyWebToMobileVersionMapping
      : {}
  }

  public getDesktopDownloadsUrl(version: string): string {
    return DesktopDownloadsUrlBase + version
  }

  public getDesktopVersionForWebVersion(webVersion: string): string {
    return LegacyWebToDesktopVersionMapping[webVersion] ?? webVersion
  }
}
