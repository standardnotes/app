const ExpectedItemCountsWithVaultFeatureEnabled = {
  Items: ['ItemsKey', 'UserPreferences'].length,
  ItemsWithAccount: ['ItemsKey', 'UserPreferences', 'TrustedSelfContact'].length,
  ItemsWithAccountWithoutItemsKey: ['UserPreferences', 'TrustedSelfContact'].length,
  ItemsNoAccounNoItemsKey: ['UserPreferences'].length,
  BackupFileRootKeyEncryptedItems: ['TrustedSelfContact'].length,
}

const ExpectedItemCountsWithVaultFeatureDisabled = {
  Items: ['ItemsKey', 'UserPreferences'].length,
  ItemsWithAccount: ['ItemsKey', 'UserPreferences'].length,
  ItemsWithAccountWithoutItemsKey: ['UserPreferences'].length,
  ItemsNoAccounNoItemsKey: ['UserPreferences'].length,
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
