import {
  ActionObserver,
  ComponentEventObserver,
  ComponentMessage,
  ComponentOrNativeFeature,
} from '@standardnotes/models'
import { FeatureStatus } from '../Feature/FeatureStatus'
import { ComponentViewerError } from './ComponentViewerError'
import { IframeComponentFeatureDescription } from '@standardnotes/features'

export interface ComponentViewerInterface {
  readonly identifier: string
  readonly lockReadonly: boolean
  readonly sessionKey?: string

  get url(): string
  get componentUniqueIdentifier(): string

  getComponentOrFeatureItem(): ComponentOrNativeFeature<IframeComponentFeatureDescription>

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
