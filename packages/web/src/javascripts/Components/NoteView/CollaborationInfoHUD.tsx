import { FunctionComponent } from 'react'
import { DecryptedItemInterface } from '@standardnotes/snjs'
import VaultNameBadge from '../Vaults/VaultNameBadge'
import LastEditedByBadge from '../Vaults/LastEditedByBadge'
import { useItemVaultInfo } from '@/Hooks/useItemVaultInfo'

type Props = {
  item: DecryptedItemInterface
}

const CollaborationInfoHUD: FunctionComponent<Props> = ({ item }) => {
  const { vault, lastEditedByContact } = useItemVaultInfo(item)

  if (!vault) {
    return null
  }

  return (
    <div className="flex flex-wrap items-start gap-2">
      <VaultNameBadge vault={vault} />
      {lastEditedByContact && <LastEditedByBadge contact={lastEditedByContact} />}
    </div>
  )
}

export default CollaborationInfoHUD
