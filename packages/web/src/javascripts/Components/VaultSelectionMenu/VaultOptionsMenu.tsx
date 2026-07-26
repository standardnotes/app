import { VaultListingInterface } from '@standardnotes/snjs'
import { c } from 'ttag'
import Menu from '../Menu/Menu'
import MenuItem from '../Menu/MenuItem'
import Icon from '../Icon/Icon'
import { useState, useCallback } from 'react'
import EditVaultModal from '../Preferences/Panes/Vaults/Vaults/VaultModal/EditVaultModal'
import { useVault } from '@/Hooks/useVault'

type Props = {
  vault: VaultListingInterface
}

const VaultOptionsMenu = ({ vault }: Props) => {
  const { canShowLockOption, isLocked, toggleLock, ensureVaultIsUnlocked } = useVault(vault)

  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false)
  const openEditModal = useCallback(async () => {
    if (!(await ensureVaultIsUnlocked())) {
      return
    }

    setIsVaultModalOpen(true)
  }, [ensureVaultIsUnlocked])

  return (
    <>
      <Menu a11yLabel={c('B2.NavSharedUI.Label').t`Vault options menu`}>
        <MenuItem onClick={openEditModal}>
          <Icon type="pencil-filled" className="mr-2" />
          {c('B2.NavSharedUI.Action').t`Edit vault`}
        </MenuItem>
        {canShowLockOption && (
          <MenuItem onClick={toggleLock}>
            <Icon type="lock" className="mr-2" />
            {isLocked ? c('B2.NavSharedUI.Action').t`Unlock vault` : c('B2.NavSharedUI.Action').t`Lock vault`}
          </MenuItem>
        )}
      </Menu>
      <EditVaultModal
        vault={vault}
        isVaultModalOpen={isVaultModalOpen}
        closeVaultModal={() => setIsVaultModalOpen(false)}
      />
    </>
  )
}

export default VaultOptionsMenu
