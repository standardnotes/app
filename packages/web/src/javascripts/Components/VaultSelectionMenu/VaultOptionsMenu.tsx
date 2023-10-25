import { VaultListingInterface } from '@standardnotes/snjs'
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
      <Menu a11yLabel="Vault options menu">
        <MenuItem onClick={openEditModal}>
          <Icon type="pencil-filled" className="mr-2" />
          Edit vault
        </MenuItem>
        {canShowLockOption && (
          <MenuItem onClick={toggleLock}>
            <Icon type="lock" className="mr-2" />
            {isLocked ? 'Unlock' : 'Lock'} vault
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
