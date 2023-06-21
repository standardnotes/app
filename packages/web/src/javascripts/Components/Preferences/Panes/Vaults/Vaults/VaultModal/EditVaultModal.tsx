import { FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react'
import Modal, { ModalAction } from '@/Components/Modal/Modal'
import DecoratedInput from '@/Components/Input/DecoratedInput'
import { useApplication } from '@/Components/ApplicationProvider'
import {
  KeySystemRootKeyPasswordType,
  KeySystemRootKeyStorageType,
  SharedVaultInviteServerHash,
  SharedVaultUserServerHash,
  VaultListingInterface,
  isClientDisplayableError,
} from '@standardnotes/snjs'
import { VaultModalMembers } from './VaultModalMembers'
import { VaultModalInvites } from './VaultModalInvites'
import { PasswordTypePreference } from './PasswordTypePreference'
import { KeyStoragePreference } from './KeyStoragePreference'

type Props = {
  existingVault?: VaultListingInterface
  onCloseDialog: () => void
}

const EditVaultModal: FunctionComponent<Props> = ({ onCloseDialog, existingVault }) => {
  const application = useApplication()

  const [name, setName] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [members, setMembers] = useState<SharedVaultUserServerHash[]>([])
  const [invites, setInvites] = useState<SharedVaultInviteServerHash[]>([])
  const [isAdmin, setIsAdmin] = useState<boolean>(true)
  const [passwordType, setPasswordType] = useState<KeySystemRootKeyPasswordType>(
    KeySystemRootKeyPasswordType.Randomized,
  )
  const [keyStorageType, setKeyStorageType] = useState<KeySystemRootKeyStorageType>(KeySystemRootKeyStorageType.Synced)
  const [customKey, setCustomKey] = useState<string | undefined>(undefined)

  const reloadVaultInfo = useCallback(async () => {
    if (existingVault) {
      setName(existingVault.name ?? '')
      setDescription(existingVault.description ?? '')
      setPasswordType(existingVault.rootKeyParams.passwordType)
      setKeyStorageType(existingVault.rootKeyStorage)

      if (existingVault.isSharedVaultListing()) {
        setIsAdmin(
          existingVault.isSharedVaultListing() && application.sharedVaults.isCurrentUserSharedVaultAdmin(existingVault),
        )

        const users = await application.sharedVaults.getSharedVaultUsers(existingVault)
        if (users) {
          setMembers(users)
        }

        const invites = await application.sharedVaults.getOutboundInvites(existingVault)
        if (!isClientDisplayableError(invites)) {
          setInvites(invites)
        }
      }
    }
  }, [application.sharedVaults, existingVault])

  useEffect(() => {
    if (existingVault) {
      void reloadVaultInfo()
    }
  }, [application.vaults, existingVault, reloadVaultInfo])

  const handleDialogClose = useCallback(() => {
    onCloseDialog()
  }, [onCloseDialog])

  const saveExistingVault = useCallback(
    async (vault: VaultListingInterface) => {
      if (vault.name !== name || vault.description !== description) {
        await application.vaults.changeVaultNameAndDescription(vault, {
          name: name,
          description: description,
        })
      }

      if (vault.rootKeyStorage !== keyStorageType) {
        await application.vaults.changeVaultKeyStoragePreference(vault, keyStorageType)
      }

      if (vault.rootKeyParams.passwordType !== passwordType) {
        if (passwordType === KeySystemRootKeyPasswordType.Randomized) {
          if (customKey) {
            throw new Error('Custom key should not be set')
          }
          await application.vaults.changeVaultPasswordTypeFromUserInputtedToRandomized(vault)
        } else if (passwordType === KeySystemRootKeyPasswordType.UserInputted) {
          if (!customKey) {
            throw new Error('Custom key is not set')
          }
          await application.vaults.changeVaultPasswordTypeFromRandomizedToUserInputted(vault, customKey)
        }
      }
    },
    [application.vaults, customKey, description, keyStorageType, name, passwordType],
  )

  const createNewVault = useCallback(async () => {
    if (passwordType === KeySystemRootKeyPasswordType.UserInputted) {
      if (!customKey) {
        throw new Error('Custom key is not set')
      }
      await application.vaults.createUserInputtedPasswordVault({
        name,
        description,
        storagePreference: keyStorageType,
        userInputtedPassword: customKey,
      })
    } else {
      await application.vaults.createRandomizedVault({
        name,
        description,
        storagePreference: keyStorageType,
      })
    }

    handleDialogClose()
  }, [application.vaults, customKey, description, handleDialogClose, keyStorageType, name, passwordType])

  const handleSubmit = useCallback(async () => {
    if (existingVault) {
      await saveExistingVault(existingVault)
    } else {
      await createNewVault()
    }
    handleDialogClose()
  }, [existingVault, handleDialogClose, saveExistingVault, createNewVault])

  const modalActions = useMemo(
    (): ModalAction[] => [
      {
        label: existingVault ? 'Save Vault' : 'Create Vault',
        onClick: handleSubmit,
        type: 'primary',
        mobileSlot: 'right',
      },
      {
        label: 'Cancel',
        onClick: handleDialogClose,
        type: 'cancel',
        mobileSlot: 'left',
      },
    ],
    [existingVault, handleDialogClose, handleSubmit],
  )

  return (
    <Modal title={existingVault ? 'Edit Vault' : 'Create New Vault'} close={handleDialogClose} actions={modalActions}>
      <div className="px-4.5 pt-4 pb-1.5">
        <div className="flex w-full flex-col">
          <div className="mb-3">
            <div className="text-lg">Vault Info</div>
            <div className="mt-1">The vault name and description are end-to-end encrypted.</div>

            <DecoratedInput
              className={{ container: 'mt-4' }}
              id="vault-name-input"
              value={name}
              placeholder="Vault Name"
              onChange={(value) => {
                setName(value)
              }}
            />

            <DecoratedInput
              className={{ container: 'mt-4' }}
              id="vault-email-input"
              value={description}
              placeholder="Vault description"
              onChange={(value) => {
                setDescription(value)
              }}
            />
          </div>

          {existingVault && (
            <VaultModalMembers vault={existingVault} members={members} onChange={reloadVaultInfo} isAdmin={isAdmin} />
          )}

          {existingVault && <VaultModalInvites invites={invites} onChange={reloadVaultInfo} isAdmin={isAdmin} />}

          <PasswordTypePreference value={passwordType} onChange={setPasswordType} onCustomKeyChange={setCustomKey} />

          <KeyStoragePreference value={keyStorageType} onChange={setKeyStorageType} />
        </div>
      </div>
    </Modal>
  )
}

export default EditVaultModal
