const ExpectedItemCountsWithVaultFeatureEnabled = {
  Items: ['ItemsKey', 'UserPreferences', 'DarkTheme'].length,
  ItemsWithAccount: ['ItemsKey', 'UserPreferences', 'DarkTheme', 'TrustedSelfContact'].length,
  ItemsWithAccountWithoutItemsKey: ['UserPreferences', 'DarkTheme', 'TrustedSelfContact'].length,
  ItemsNoAccounNoItemsKey: ['UserPreferences', 'DarkTheme'].length,
  BackupFileRootKeyEncryptedItems: ['TrustedSelfContact'].length,
}

const ExpectedItemCountsWithVaultFeatureDisabled = {
  Items: ['ItemsKey', 'UserPreferences', 'DarkTheme'].length,
  ItemsWithAccount: ['ItemsKey', 'UserPreferences', 'DarkTheme'].length,
  ItemsWithAccountWithoutItemsKey: ['UserPreferences', 'DarkTheme'].length,
  ItemsNoAccounNoItemsKey: ['UserPreferences', 'DarkTheme'].length,
  BackupFileRootKeyEncryptedItems: [].length,
}

const isVaultsEnabled = InternalFeatureService.get().isFeatureEnabled(InternalFeature.Vaults)

export const BaseItemCounts = {
  DefaultItems: isVaultsEnabled
    ? ExpectedItemCountsWithVaultFeatureEnabled.Items
    : ExpectedItemCountsWithVaultFeatureDisabled.Items,
  DefaultItemsWithAccount: isVaultsEnabled
    ? ExpectedItemCountsWithVaultFeatureEnabled.ItemsWithAccount
    : ExpectedItemCountsWithVaultFeatureDisabled.ItemsWithAccount,
  DefaultItemsWithAccountWithoutItemsKey: isVaultsEnabled
    ? ExpectedItemCountsWithVaultFeatureEnabled.ItemsWithAccountWithoutItemsKey
    : ExpectedItemCountsWithVaultFeatureDisabled.ItemsWithAccountWithoutItemsKey,
  DefaultItemsNoAccounNoItemsKey: isVaultsEnabled
    ? ExpectedItemCountsWithVaultFeatureEnabled.ItemsNoAccounNoItemsKey
    : ExpectedItemCountsWithVaultFeatureDisabled.ItemsNoAccounNoItemsKey,
  BackupFileRootKeyEncryptedItems: isVaultsEnabled
    ? ExpectedItemCountsWithVaultFeatureEnabled.BackupFileRootKeyEncryptedItems
    : ExpectedItemCountsWithVaultFeatureDisabled.BackupFileRootKeyEncryptedItems,
}
