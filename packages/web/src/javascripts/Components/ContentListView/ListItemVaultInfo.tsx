import { FunctionComponent } from 'react'
import { useApplication } from '../ApplicationProvider'
import { DecryptedItemInterface, classNames } from '@standardnotes/snjs'
import VaultNameBadge from '../Vaults/VaultNameBadge'
import SharedByContactBadge from '../Vaults/SharedByContactBadge'

type Props = {
  item: DecryptedItemInterface
  className?: string
}

const ListItemVaultInfo: FunctionComponent<Props> = ({ item, className }) => {
  const application = useApplication()

  if (!application.featuresController.isEntitledToVaults()) {
    return null
  }

  if (application.items.isTemplateItem(item)) {
    return null
  }

  const vault = application.vaults.getItemVault(item)
  if (!vault) {
    return null
  }

  const sharedByContact = application.sharedVaults.getItemSharedBy(item)

  return (
    <div className={classNames('flex flex-wrap items-center gap-2', className)}>
      <VaultNameBadge vault={vault} />
      {sharedByContact && <SharedByContactBadge contact={sharedByContact} />}
    </div>
  )
}

export default ListItemVaultInfo
