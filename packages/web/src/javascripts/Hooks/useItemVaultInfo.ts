import { useApplication } from '@/Components/ApplicationProvider'
import { DecryptedItemInterface, TrustedContactInterface, VaultListingInterface } from '@standardnotes/snjs'

type ItemVaultInfo = {
  vault?: VaultListingInterface
  lastEditedByContact?: TrustedContactInterface
}

export const useItemVaultInfo = (item: DecryptedItemInterface): ItemVaultInfo => {
  const application = useApplication()

  const info: ItemVaultInfo = {
    vault: undefined,
    lastEditedByContact: undefined,
  }

  if (!application.featuresController.isEntitledToVaults()) {
    return info
  }

  if (application.items.isTemplateItem(item)) {
    return info
  }

  info.vault = application.vaults.getItemVault(item)
  info.lastEditedByContact = application.sharedVaults.getItemLastEditedBy(item)

  return info
}
