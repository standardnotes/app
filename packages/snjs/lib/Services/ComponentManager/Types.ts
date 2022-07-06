import {
  ComponentArea,
  ComponentAction,
  ComponentPermission,
  FeatureIdentifier,
  LegacyFileSafeIdentifier,
} from '@standardnotes/features'
import { ItemContent, SNComponent, DecryptedTransferPayload } from '@standardnotes/models'
import { UuidString } from '@Lib/Types/UuidString'
import { ContentType } from '@standardnotes/common'

export interface DesktopManagerInterface {
  syncComponentsInstallation(components: SNComponent[]): void
  registerUpdateObserver(callback: (component: SNComponent) => void): void
  getExtServerHost(): string
}

export type IncomingComponentItemPayload = DecryptedTransferPayload & {
  clientData: Record<string, unknown>
}

export type OutgoingItemMessagePayload = {
  uuid: string
  content_type: ContentType
  created_at: Date
  updated_at: Date
  deleted?: boolean
  content?: ItemContent
  clientData?: Record<string, unknown>

  /**
   * isMetadataUpdate implies that the extension should make reference of updated
   * metadata, but not update content values as they may be stale relative to what the
   * extension currently has.
   */
  isMetadataUpdate: boolean
}

/**
 * Extensions allowed to batch stream AllowedBatchContentTypes
 */
export const AllowedBatchStreaming = Object.freeze([
  LegacyFileSafeIdentifier,
  FeatureIdentifier.DeprecatedFileSafe,
  FeatureIdentifier.DeprecatedBoldEditor,
])

/**
 * Content types which are allowed to be managed/streamed in bulk by a component.
 */
export const AllowedBatchContentTypes = Object.freeze([
  ContentType.FilesafeCredentials,
  ContentType.FilesafeFileMetadata,
  ContentType.FilesafeIntegration,
])

export type StreamObserver = {
  identifier: string
  componentUuid: UuidString
  area: ComponentArea
  originalMessage: ComponentMessage
  /** contentTypes is optional in the case of a context stream observer */
  contentTypes?: ContentType[]
}

export type PermissionDialog = {
  component: SNComponent
  permissions: ComponentPermission[]
  permissionsString: string
  actionBlock: (approved: boolean) => void
  callback: (approved: boolean) => void
}

export enum KeyboardModifier {
  Shift = 'Shift',
  Ctrl = 'Control',
  Meta = 'Meta',
}

export type MessageData = Partial<{
  /** Related to the stream-item-context action */
  item?: IncomingComponentItemPayload
  /** Related to the stream-items action */
  content_types?: ContentType[]
  items?: IncomingComponentItemPayload[]
  /** Related to the request-permission action */
  permissions?: ComponentPermission[]
  /** Related to the component-registered action */
  componentData?: Record<string, unknown>
  uuid?: UuidString
  environment?: string
  platform?: string
  activeThemeUrls?: string[]
  /** Related to set-size action */
  width?: string | number
  height?: string | number
  type?: string
  /** Related to themes action */
  themes?: string[]
  /** Related to clear-selection action */
  content_type?: ContentType
  /** Related to key-pressed action */
  keyboardModifier?: KeyboardModifier
}>

export type MessageReplyData = {
  approved?: boolean
  deleted?: boolean
  error?: string
  item?: OutgoingItemMessagePayload
  items?: OutgoingItemMessagePayload[]
  themes?: string[]
}

export type StreamItemsMessageData = MessageData & {
  content_types: ContentType[]
}

export type DeleteItemsMessageData = MessageData & {
  items: OutgoingItemMessagePayload[]
}

export type ComponentMessage = {
  action: ComponentAction
  sessionKey?: string
  componentData?: Record<string, unknown>
  data: MessageData
}

export type MessageReply = {
  action: ComponentAction
  original: ComponentMessage
  data: MessageReplyData
}
