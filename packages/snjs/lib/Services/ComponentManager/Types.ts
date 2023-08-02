import { ComponentArea, ComponentAction, NativeFeatureIdentifier } from '@standardnotes/features'
import { ComponentMessage, MessageData, OutgoingItemMessagePayload } from '@standardnotes/models'
import { UuidString } from '@Lib/Types/UuidString'
import { ContentType } from '@standardnotes/domain-core'

export const ReadwriteActions = [
  ComponentAction.SaveItems,
  ComponentAction.CreateItem,
  ComponentAction.CreateItems,
  ComponentAction.DeleteItems,
  ComponentAction.SetComponentData,
]

export type Writeable<T> = { -readonly [P in keyof T]: T[P] }

/**
 * Extensions allowed to batch stream AllowedBatchContentTypes
 */
export const AllowedBatchStreaming = Object.freeze([
  NativeFeatureIdentifier.TYPES.LegacyFileSafeIdentifier,
  NativeFeatureIdentifier.TYPES.DeprecatedFileSafe,
  NativeFeatureIdentifier.TYPES.DeprecatedBoldEditor,
])

/**
 * Content types which are allowed to be managed/streamed in bulk by a component.
 */
export const AllowedBatchContentTypes = Object.freeze([
  ContentType.TYPES.FilesafeCredentials,
  ContentType.TYPES.FilesafeFileMetadata,
  ContentType.TYPES.FilesafeIntegration,
])

export type StreamObserver = {
  identifier: string
  componentUuid: UuidString
  area: ComponentArea
  originalMessage: ComponentMessage
  /** contentTypes is optional in the case of a context stream observer */
  contentTypes?: ContentType[]
}

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

export type MessageReply = {
  action: ComponentAction
  original: ComponentMessage
  data: MessageReplyData
}
