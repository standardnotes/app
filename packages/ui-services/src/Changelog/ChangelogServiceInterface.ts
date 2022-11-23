import { Changelog, ChangelogVersion } from './Changelog'

export interface ChangelogServiceInterface {
  getChangelog(): Promise<Changelog>
  getVersions(): Promise<ChangelogVersion[]>
  getDownloadsUrl(version: string): string
}
