import { FunctionComponent } from 'react'
import { useApplication } from '../ApplicationProvider'
import Icon from '../Icon/Icon'
import { DecryptedItemInterface } from '@standardnotes/snjs'

type Props = {
  item: DecryptedItemInterface
}

const ListItemCollaborationInfo: FunctionComponent<Props> = ({ item }) => {
  const application = useApplication()
  const vaultInfo = application.vaults.getVaultInfoForItem(item)

  if (!vaultInfo) {
    return null
  }

  const vaultNameDisplay = vaultInfo.vaultName || vaultInfo.vaultUuid.split('-')[0]
  const sharedByContact = application.vaults.getItemSharedBy(item)

  return (
    <div className="mt-0.5 flex flex-wrap items-center gap-2">
      <div className={'mt-2 rounded bg-success py-1 px-1.5 text-danger-contrast'}>
        <span className="flex items-center" title="Shared in vault">
          <Icon ariaLabel="Shared in vault" type="safe-square" className="mr-1 text-info-contrast" size="medium" />
          <div className="text-center text-xs font-bold">{vaultNameDisplay}</div>
        </span>
      </div>

      {sharedByContact && (
        <div title="Shared by contact" className={'mt-2 rounded bg-info py-1 px-1.5 text-neutral-contrast'}>
          <span className="flex items-center" title="Shared by contact">
            <Icon ariaLabel="Shared by contact" type="archive" className="mr-1 text-info-contrast" size="medium" />
            <div className="text-center text-xs font-bold">{sharedByContact?.name}</div>
          </span>
        </div>
      )}
    </div>
  )
}

export default ListItemCollaborationInfo
