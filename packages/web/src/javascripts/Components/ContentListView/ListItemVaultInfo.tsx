import { FunctionComponent } from 'react'
import { DecryptedItemInterface, classNames } from '@standardnotes/snjs'
import VaultNameBadge from '../Vaults/VaultNameBadge'
import SharedByContactBadge from '../Vaults/SharedByContactBadge'
import { useItemVaultInfo } from '@/Hooks/useItemVaultInfo'

type Props = {
  item: DecryptedItemInterface
  className?: string
}

const ListItemVaultInfo: FunctionComponent<Props> = ({ item, className }) => {
  const { vault, sharedByContact } = useItemVaultInfo(item)

  if (!vault) {
    return null
  }

  return (
    <div className={classNames('flex flex-wrap items-center gap-2', className)}>
      <VaultNameBadge vault={vault} />
      {sharedByContact && <SharedByContactBadge contact={sharedByContact} />}
    </div>
  )
}

export default ListItemVaultInfo
