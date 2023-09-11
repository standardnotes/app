import { useApplication } from '@/Components/ApplicationProvider'
import { DecryptedItemInterface, TrustedContactInterface, VaultListingInterface } from '@standardnotes/snjs'
import useItem from './useItem'

type ItemVaultInfo = {
  vault?: VaultListingInterface
  lastEditedByContact?: TrustedContactInterface
  sharedByContact?: TrustedContactInterface
}

export const useItemVaultInfo = (item: DecryptedItemInterface): ItemVaultInfo => {
  const application = useApplication()

  const info: ItemVaultInfo = {
    vault: undefined,
    lastEditedByContact: undefined,
  }

  info.vault = useItem(application.vaults.getItemVault(item)?.uuid)

  if (!application.featuresController.isEntitledToVaults()) {
    return info
  }

  info.lastEditedByContact = application.sharedVaults.getItemLastEditedBy(item)
  info.sharedByContact = application.sharedVaults.getItemSharedBy(item)

  return info
}
