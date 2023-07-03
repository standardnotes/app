import { ConflictType } from './ConflictType'
import { ServerItemResponse } from './ServerItemResponse'

type BaseConflictParams<T = ServerItemResponse> = {
  type: ConflictType
  server_item?: T
  unsaved_item?: T
}

export type ConflictParamsWithServerItem<T = ServerItemResponse> = BaseConflictParams<T> & {
  server_item: T
  unsaved_item: never
}

export type ConflictParamsWithUnsavedItem<T = ServerItemResponse> = BaseConflictParams<T> & {
  unsaved_item: T
  server_item: never
}

export type ConflictParamsWithServerAndUnsavedItem<T = ServerItemResponse> = BaseConflictParams<T> & {
  server_item: T
  unsaved_item: T
}

export type ConflictConflictingDataParams<T = ServerItemResponse> = BaseConflictParams<T> & {
  type: ConflictType.ConflictingData
  server_item: T
  unsaved_item: never
}

export type ConflictUuidConflictParams<T = ServerItemResponse> = BaseConflictParams<T> & {
  type: ConflictType.UuidConflict
  server_item: never
  unsaved_item: T
}

export type ConflictContentTypeErrorParams<T = ServerItemResponse> = BaseConflictParams<T> & {
  type: ConflictType.ContentTypeError
  server_item: never
  unsaved_item: T
}

export type ConflictContentErrorParams<T = ServerItemResponse> = BaseConflictParams<T> & {
  type: ConflictType.ContentError
  server_item: never
  unsaved_item: T
}

export type ConflictReadOnlyErrorParams<T = ServerItemResponse> = BaseConflictParams<T> & {
  type: ConflictType.ReadOnlyError
  server_item: T
  unsaved_item: T
}

export type ConflictUuidErrorParams<T = ServerItemResponse> = BaseConflictParams<T> & {
  type: ConflictType.UuidError
  server_item: never
  unsaved_item: T
}

export type ConflictSharedVaultNotMemberErrorParams<T = ServerItemResponse> = BaseConflictParams<T> & {
  type: ConflictType.SharedVaultNotMemberError
  server_item: never
  unsaved_item: T
}

export type ConflictSharedVaultInsufficientPermissionsErrorParams<T = ServerItemResponse> = BaseConflictParams<T> & {
  type: ConflictType.SharedVaultInsufficientPermissionsError
  unsaved_item: T
}

export function conflictParamsHasServerItemAndUnsavedItem<T = ServerItemResponse>(
  params: BaseConflictParams<T>,
): params is ConflictParamsWithServerAndUnsavedItem<T> {
  return params.server_item !== undefined && params.unsaved_item !== undefined
}

export function conflictParamsHasOnlyServerItem<T = ServerItemResponse>(
  params: BaseConflictParams<T>,
): params is ConflictParamsWithServerItem<T> {
  return params.server_item !== undefined
}

export function conflictParamsHasOnlyUnsavedItem<T = ServerItemResponse>(
  params: BaseConflictParams<T>,
): params is ConflictParamsWithUnsavedItem<T> {
  return params.unsaved_item !== undefined
}

export type ConflictParams<T = ServerItemResponse> =
  | ConflictConflictingDataParams<T>
  | ConflictUuidConflictParams<T>
  | ConflictContentTypeErrorParams<T>
  | ConflictContentErrorParams<T>
  | ConflictReadOnlyErrorParams<T>
  | ConflictUuidErrorParams<T>
  | ConflictSharedVaultNotMemberErrorParams<T>
  | ConflictSharedVaultInsufficientPermissionsErrorParams<T>
