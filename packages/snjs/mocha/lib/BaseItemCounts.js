const ExpectedItemCountsWithVaultFeatureEnabled = {
  DefaultItems: ['ItemsKey', 'UserPreferences', 'DarkTheme'].length,
  DefaultItemsWithAccount: ['ItemsKey', 'UserPreferences', 'DarkTheme', 'TrustedSelfContact'].length,
  DefaultItemsWithAccountWithoutItemsKey: ['UserPreferences', 'DarkTheme', 'TrustedSelfContact'].length,
  DefaultItemsNoAccounNoItemsKey: ['UserPreferences', 'DarkTheme'].length,
}

const ExpectedItemCountsWithVaultFeatureDisabled = {
  DefaultItems: ['ItemsKey', 'UserPreferences', 'DarkTheme'].length,
  DefaultItemsWithAccount: ['ItemsKey', 'UserPreferences', 'DarkTheme'].length,
  DefaultItemsWithAccountWithoutItemsKey: ['UserPreferences', 'DarkTheme'].length,
  DefaultItemsNoAccounNoItemsKey: ['UserPreferences', 'DarkTheme'].length,
}

const isVaultsEnabled = InternalFeatureService.get().isFeatureEnabled(InternalFeature.Vaults)

export const BaseItemCounts = {
  DefaultItems: isVaultsEnabled
    ? ExpectedItemCountsWithVaultFeatureEnabled.DefaultItems
    : ExpectedItemCountsWithVaultFeatureDisabled.DefaultItems,
  DefaultItemsWithAccount: isVaultsEnabled
    ? ExpectedItemCountsWithVaultFeatureEnabled.DefaultItemsWithAccount
    : ExpectedItemCountsWithVaultFeatureDisabled.DefaultItemsWithAccount,
  DefaultItemsWithAccountWithoutItemsKey: isVaultsEnabled
    ? ExpectedItemCountsWithVaultFeatureEnabled.DefaultItemsWithAccountWithoutItemsKey
    : ExpectedItemCountsWithVaultFeatureDisabled.DefaultItemsWithAccountWithoutItemsKey,
  DefaultItemsNoAccounNoItemsKey: isVaultsEnabled
    ? ExpectedItemCountsWithVaultFeatureEnabled.DefaultItemsNoAccounNoItemsKey
    : ExpectedItemCountsWithVaultFeatureDisabled.DefaultItemsNoAccounNoItemsKey,
}
