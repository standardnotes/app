import { ActionObserver, ComponentEventObserver, ComponentMessage, UIFeature } from '@standardnotes/models'
import { FeatureStatus } from '../Feature/FeatureStatus'
import { ComponentViewerError } from './ComponentViewerError'
import { IframeComponentFeatureDescription, NativeFeatureIdentifier } from '@standardnotes/features'
import { Uuid } from '@standardnotes/domain-core'

export interface ComponentViewerInterface {
  readonly identifier: string
  readonly lockReadonly: boolean
  readonly sessionKey?: string

  get url(): string
  get componentUniqueIdentifier(): NativeFeatureIdentifier | Uuid

  getComponentOrFeatureItem(): UIFeature<IframeComponentFeatureDescription>

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
