import { FunctionComponent } from 'react'
import Icon from '../Icon/Icon'
import { useApplication } from '../ApplicationProvider'
import { DecryptedItemInterface } from '@standardnotes/snjs'
import { FeatureTrunkName, featureTrunkEnabled } from '@/FeatureTrunk'

type Props = {
  item: DecryptedItemInterface
}

const CollaborationInfoHUD: FunctionComponent<Props> = ({ item }) => {
  const application = useApplication()

  if (!featureTrunkEnabled(FeatureTrunkName.Vaults)) {
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
      <div title="Vault name" className={'flex rounded bg-success py-1 px-1.5 text-success-contrast'}>
        <Icon ariaLabel="Shared in vault" type="safe-square" className="mr-1 text-info-contrast" size="medium" />
        <span className="mr-auto overflow-hidden text-ellipsis text-xs">{vault.name}</span>
      </div>

      {lastEditedBy && (
        <div title="Last edited by" className={'flex rounded bg-info py-1 px-1.5 text-info-contrast'}>
          <Icon ariaLabel="Shared by" type="pencil" className="mr-1 text-info-contrast" size="medium" />
          <span className="mr-auto overflow-hidden text-ellipsis text-xs">{lastEditedBy?.name}</span>
        </div>
      )}
    </div>
  )
}

export default CollaborationInfoHUD
