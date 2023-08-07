import { FunctionComponent } from 'react'
import Icon from '../Icon/Icon'
import { useApplication } from '../ApplicationProvider'
import { DecryptedItemInterface } from '@standardnotes/snjs'
import { featureTrunkVaultsEnabled } from '@/FeatureTrunk'
import VaultNameBadge from '../Vaults/VaultNameBadge'

type Props = {
  item: DecryptedItemInterface
}

const CollaborationInfoHUD: FunctionComponent<Props> = ({ item }) => {
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

  const lastEditedBy = application.sharedVaults.getItemLastEditedBy(item)

  return (
    <div className="flex flex-wrap items-start gap-2">
      <VaultNameBadge vault={vault} />

      {lastEditedBy && (
        <div title="Last edited by" className="flex rounded bg-info px-1.5 py-1 text-info-contrast select-none">
          <Icon ariaLabel="Shared by" type="pencil" className="mr-1 text-info-contrast" size="medium" />
          <span className="mr-auto overflow-hidden text-ellipsis text-xs">{lastEditedBy?.name}</span>
        </div>
      )}
    </div>
  )
}

export default CollaborationInfoHUD
