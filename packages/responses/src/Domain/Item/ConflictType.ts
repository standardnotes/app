export enum ConflictType {
  ConflictingData = 'sync_conflict',
  UuidConflict = 'uuid_conflict',
  ContentTypeError = 'content_type_error',
  ContentError = 'content_error',
  ReadOnlyError = 'readonly_error',
  UuidError = 'uuid_error',

  SnjsVersionError = 'snjs_version_error',

  SharedVaultInsufficientPermissionsError = 'shared_vault_insufficient_permissions_error',
  SharedVaultNotMemberError = 'shared_vault_not_member_error',
  SharedVaultInvalidItemsKey = 'shared_vault_invalid_items_key',
}
