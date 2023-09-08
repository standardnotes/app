import { FunctionComponent } from 'react'
import { useApplication } from '../ApplicationProvider'
import { DecryptedItemInterface } from '@standardnotes/snjs'
import VaultNameBadge from '../Vaults/VaultNameBadge'
import LastEditedByBadge from '../Vaults/LastEditedByBadge'

type Props = {
  item: DecryptedItemInterface
}

const CollaborationInfoHUD: FunctionComponent<Props> = ({ item }) => {
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

  const lastEditedBy = application.sharedVaults.getItemLastEditedBy(item)

  return (
    <div className="flex flex-wrap items-start gap-2">
      <VaultNameBadge vault={vault} />
      {lastEditedBy && <LastEditedByBadge contact={lastEditedBy} />}
    </div>
  )
}

export default CollaborationInfoHUD
