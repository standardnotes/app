import { ComponentInterface } from '@standardnotes/models'

export interface DesktopManagerInterface {
  syncComponentsInstallation(components: ComponentInterface[]): void
  registerUpdateObserver(callback: (component: ComponentInterface) => void): () => void
  getExtServerHost(): string
  saveDesktopBackup(): Promise<void>
  searchText(text?: string): void
  redoSearch(): void
}
