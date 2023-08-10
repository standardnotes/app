export enum ConflictType {
  ConflictingData = 'sync_conflict',
  UuidConflict = 'uuid_conflict',
  ContentTypeError = 'content_type_error',
  ContentError = 'content_error',
  ReadOnlyError = 'readonly_error',
  UuidError = 'uuid_error',
  InvalidServerItem = 'invalid_server_item',

  SharedVaultSnjsVersionError = 'shared_vault_snjs_version_error',
  SharedVaultInsufficientPermissionsError = 'shared_vault_insufficient_permissions_error',
  SharedVaultNotMemberError = 'shared_vault_not_member_error',
  SharedVaultInvalidState = 'shared_vault_invalid_state',
}
