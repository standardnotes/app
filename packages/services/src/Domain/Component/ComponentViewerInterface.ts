import {
  ActionObserver,
  ComponentEventObserver,
  ComponentMessage,
  DecryptedItemInterface,
  SNComponent,
} from '@standardnotes/models'
import { FeatureStatus } from '../Feature/FeatureStatus'
import { ComponentViewerError } from './ComponentViewerError'

export interface ComponentViewerInterface {
  readonly component: SNComponent
  readonly url?: string
  identifier: string
  lockReadonly: boolean
  sessionKey?: string
  overrideContextItem?: DecryptedItemInterface
  get componentUuid(): string
  destroy(): void
  setReadonly(readonly: boolean): void
  getFeatureStatus(): FeatureStatus
  shouldRender(): boolean
  getError(): ComponentViewerError | undefined
  setWindow(window: Window): void
  addEventObserver(observer: ComponentEventObserver): () => void
  addActionObserver(observer: ActionObserver): () => void
  postActiveThemes(): void
  handleMessage(message: ComponentMessage): void
}
