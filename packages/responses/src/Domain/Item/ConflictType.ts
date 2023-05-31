export enum ConflictType {
  ConflictingData = 'sync_conflict',
  UuidConflict = 'uuid_conflict',
  ContentTypeError = 'content_type_error',
  ContentError = 'content_error',
  ReadOnlyError = 'readonly_error',
  UuidError = 'uuid_error',

  SnjsVersionError = 'snjs_version_error',

  GroupInsufficientPermissionsError = 'group_insufficient_permissions_error',
  GroupNotMemberError = 'group_not_member_error',
  GroupInvalidItemsKey = 'group_invalid_items_key',
}
