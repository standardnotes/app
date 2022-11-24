import { Changelog, ChangelogVersion } from './Changelog'

export interface ChangelogServiceInterface {
  getChangelog(): Promise<Changelog>
  getVersions(): Promise<ChangelogVersion[]>
  getDesktopDownloadsUrl(version: string): string
  getDesktopVersionForWebVersion(webVersion: string): string
  markAsRead(): void
  getLastReadVersion(): string | undefined
}
