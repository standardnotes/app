export enum ConflictType {
  ConflictingData = 'sync_conflict',
  UuidConflict = 'uuid_conflict',
  ContentTypeError = 'content_type_error',
  ContentError = 'content_error',
  ReadOnlyError = 'readonly_error',
  UuidError = 'uuid_error',
  SnjsVersionError = 'snjs_version_error',
  VaultInsufficientPermissionsError = 'vault_insufficient_permissions_error',
  VaultNotMemberError = 'vault_not_member_error',
  VaultInvalidState = 'vault_invalid_state',
  VaultInvalidItemsKey = 'vault_invalid_items_key',
}
