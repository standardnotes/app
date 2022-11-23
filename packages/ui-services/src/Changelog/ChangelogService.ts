import { Changelog, ChangelogVersion } from './Changelog'
import { ChangelogServiceInterface } from './ChangelogServiceInterface'

const ChangelogUrl = 'https://raw.githubusercontent.com/standardnotes/app/main/packages/web/CHANGELOG.md.json'
const DownloadsUrlBase = 'https://github.com/standardnotes/app/releases/tag/%40standardnotes%2Fdesktop%40'

export class ChangelogService implements ChangelogServiceInterface {
  private changeLog?: Changelog

  private async performDownloadChangelog(): Promise<Changelog> {
    const response = await fetch(ChangelogUrl)
    const changelog = await response.text()
    const parsedData = JSON.parse(changelog)
    return parsedData
  }

  public async getChangelog(): Promise<Changelog> {
    if (this.changeLog) {
      return this.changeLog
    }

    this.changeLog = await this.performDownloadChangelog()

    return this.changeLog
  }

  public async getVersions(): Promise<ChangelogVersion[]> {
    const changelog = await this.getChangelog()
    return changelog.versions
  }

  public getDownloadsUrl(version: string): string {
    return DownloadsUrlBase + version
  }
}
