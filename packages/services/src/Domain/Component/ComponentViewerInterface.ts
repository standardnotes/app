import {
  ActionObserver,
  ComponentEventObserver,
  ComponentMessage,
  ComponentOrNativeFeature,
  DecryptedItemInterface,
} from '@standardnotes/models'
import { FeatureStatus } from '../Feature/FeatureStatus'
import { ComponentViewerError } from './ComponentViewerError'

export interface ComponentViewerInterface {
  readonly componentOrFeature: ComponentOrNativeFeature
  readonly url?: string
  identifier: string
  lockReadonly: boolean
  sessionKey?: string
  overrideContextItem?: DecryptedItemInterface
  get componentUniqueIdentifier(): string
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
