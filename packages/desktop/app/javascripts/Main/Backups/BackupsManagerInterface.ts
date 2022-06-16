export interface BackupsManagerInterface {
  backupsAreEnabled: boolean
  toggleBackupsStatus(): void
  backupsLocation: string
  backupsCount(): Promise<number>
  applicationDidBlur(): void
  changeBackupsLocation(): void
  beginBackups(): void
  performBackup(): void
  deleteBackups(): Promise<void>
  viewBackups(): void
  saveBackupData(data: unknown): void
}
