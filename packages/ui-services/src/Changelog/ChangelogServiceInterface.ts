import { Changelog, ChangelogVersion } from './Changelog'

export type ChangelogLastReadVersionListener = (version: string) => void

export interface ChangelogServiceInterface {
  addLastReadChangeListener(listener: ChangelogLastReadVersionListener): () => void
  getChangelog(): Promise<Changelog>
  getVersions(): Promise<ChangelogVersion[]>
  getDesktopDownloadsUrl(version: string): string
  getDesktopVersionForWebVersion(webVersion: string): string
  markAsRead(): void
  getLastReadVersion(): string | undefined
}
