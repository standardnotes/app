import { SNComponent } from '@standardnotes/models'

export interface DesktopManagerInterface {
  syncComponentsInstallation(components: SNComponent[]): void
  registerUpdateObserver(callback: (component: SNComponent) => void): () => void
  getExtServerHost(): string
}
