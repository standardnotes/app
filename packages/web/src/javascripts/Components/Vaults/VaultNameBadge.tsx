import { FunctionComponent } from 'react'
import Icon from '../Icon/Icon'
import { VaultListingInterface } from '@standardnotes/snjs'

type Props = {
  vault: VaultListingInterface
}

const VaultNameBadge: FunctionComponent<Props> = ({ vault }) => {
  return (
    <div className={'rounded bg-success px-1.5 py-1 text-danger-contrast'}>
      <span className="flex items-center" title="Vault name">
        <Icon ariaLabel="Vault name" type="safe-square" className="mr-1 text-info-contrast" size="medium" />
        <div className="text-center text-xs font-bold">{vault.name}</div>
      </span>
    </div>
  )
}

export default VaultNameBadge
