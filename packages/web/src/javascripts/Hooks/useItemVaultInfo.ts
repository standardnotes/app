import { useApplication } from '@/Components/ApplicationProvider'
import { DecryptedItemInterface, TrustedContactInterface, VaultListingInterface } from '@standardnotes/snjs'
import useItem from './useItem'
import { useRef } from 'react'

type ItemVaultInfo = {
  vault?: VaultListingInterface
  lastEditedByContact?: TrustedContactInterface
  sharedByContact?: TrustedContactInterface
}

export const useItemVaultInfo = (item: DecryptedItemInterface): ItemVaultInfo => {
  const application = useApplication()

  const info = useRef<ItemVaultInfo>({
    vault: undefined,
    lastEditedByContact: undefined,
    sharedByContact: undefined,
  })

  info.current.vault = useItem(application.vaults.getItemVault(item)?.uuid)

  const lastEditedBy = application.sharedVaults.getItemLastEditedBy(item)
  info.current.lastEditedByContact = lastEditedBy || info.current.lastEditedByContact
  info.current.sharedByContact = application.sharedVaults.getItemSharedBy(item)

  if (!application.featuresController.isEntitledToVaults()) {
    return info.current
  }

  return info.current
}
