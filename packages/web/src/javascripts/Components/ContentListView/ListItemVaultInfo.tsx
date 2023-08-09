import { FunctionComponent } from 'react'
import { useApplication } from '../ApplicationProvider'
import Icon from '../Icon/Icon'
import { DecryptedItemInterface } from '@standardnotes/snjs'
import VaultNameBadge from '../Vaults/VaultNameBadge'
import { featureTrunkVaultsEnabled } from '@/FeatureTrunk'

type Props = {
  item: DecryptedItemInterface
}

const ListItemVaultInfo: FunctionComponent<Props> = ({ item }) => {
  const application = useApplication()

  if (!featureTrunkVaultsEnabled()) {
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
    <div className="flex flex-wrap items-center gap-2">
      <VaultNameBadge vault={vault} />

      {sharedByContact && (
        <div title="Shared by contact" className="rounded bg-info px-1.5 py-1 text-neutral-contrast">
          <span className="flex items-center" title="Shared by contact">
            <Icon ariaLabel="Shared by contact" type="archive" className="mr-1 text-info-contrast" size="medium" />
            <div className="text-center text-xs font-bold">{sharedByContact?.name}</div>
          </span>
        </div>
      )}
    </div>
  )
}

export default ListItemVaultInfo
