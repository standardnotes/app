import { FunctionComponent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Modal, { ModalAction } from '@/Components/Modal/Modal'
import DecoratedInput from '@/Components/Input/DecoratedInput'
import { useApplication } from '@/Components/ApplicationProvider'
import {
  ChangeVaultKeyOptionsDTO,
  KeySystemPasswordType,
  KeySystemRootKeyStorageMode,
  SharedVaultInviteServerHash,
  SharedVaultUserServerHash,
  VaultListingInterface,
  isClientDisplayableError,
} from '@standardnotes/snjs'
import { VaultModalMembers } from './VaultModalMembers'
import { VaultModalInvites } from './VaultModalInvites'
import { PasswordTypePreference } from './PasswordTypePreference'
import { KeyStoragePreference } from './KeyStoragePreference'
import useItem from '@/Hooks/useItem'

type Props = {
  existingVaultUuid?: string
  onCloseDialog: () => void
}

const EditVaultModal: FunctionComponent<Props> = ({ onCloseDialog, existingVaultUuid }) => {
  const application = useApplication()

  const existingVault = useItem<VaultListingInterface>(existingVaultUuid)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [members, setMembers] = useState<SharedVaultUserServerHash[]>([])
  const [invites, setInvites] = useState<SharedVaultInviteServerHash[]>([])
  const [isAdmin, setIsAdmin] = useState(true)
  const [passwordType, setPasswordType] = useState<KeySystemPasswordType>(KeySystemPasswordType.Randomized)
  const [keyStorageMode, setKeyStorageMode] = useState<KeySystemRootKeyStorageMode>(KeySystemRootKeyStorageMode.Synced)
  const [customPassword, setCustomPassword] = useState<string | undefined>(undefined)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (existingVault) {
      setName(existingVault.name ?? '')
      setDescription(existingVault.description ?? '')
      setPasswordType(existingVault.rootKeyParams.passwordType)
      setKeyStorageMode(existingVault.keyStorageMode)
    }
  }, [application.vaults, existingVault])

  const reloadVaultInfo = useCallback(async () => {
    if (!existingVault) {
      return
    }

    if (existingVault.isSharedVaultListing()) {
      setIsAdmin(
        existingVault.isSharedVaultListing() && application.vaultUsers.isCurrentUserSharedVaultAdmin(existingVault),
      )

      const users = await application.vaultUsers.getSharedVaultUsers(existingVault)
      if (users) {
        setMembers(users)
      }

      const invites = await application.vaultInvites.getOutboundInvites(existingVault)
      if (!isClientDisplayableError(invites)) {
        setInvites(invites)
      }
    }
  }, [application, existingVault])

  useEffect(() => {
    void reloadVaultInfo()
  }, [application.vaults, reloadVaultInfo])

  const handleDialogClose = useCallback(() => {
    onCloseDialog()
  }, [onCloseDialog])

  const saveExistingVault = useCallback(
    async (vault: VaultListingInterface) => {
      if (!name) {
        nameInputRef.current?.focus()
        return
      }

      if (vault.name !== name || vault.description !== description) {
        await application.vaults.changeVaultNameAndDescription(vault, {
          name: name,
          description: description,
        })
      }

      const isChangingPasswordType = vault.keyPasswordType !== passwordType
      const isChangingKeyStorageMode = vault.keyStorageMode !== keyStorageMode

      const getPasswordTypeParams = (): ChangeVaultKeyOptionsDTO['newPasswordOptions'] => {
        if (!isChangingPasswordType) {
          throw new Error('Password type is not changing')
        }

        if (passwordType === KeySystemPasswordType.UserInputted) {
          if (!customPassword) {
            throw new Error('Custom password is not set')
          }
          return {
            passwordType,
            userInputtedPassword: customPassword,
          }
        } else {
          return {
            passwordType,
          }
        }
      }

      if (isChangingPasswordType || isChangingKeyStorageMode) {
        await application.vaults.changeVaultKeyOptions({
          vault,
          newPasswordOptions: isChangingPasswordType ? getPasswordTypeParams() : undefined,
          newStorageMode: isChangingKeyStorageMode ? keyStorageMode : undefined,
        })
      }

      handleDialogClose()
    },
    [application.vaults, customPassword, description, handleDialogClose, keyStorageMode, name, passwordType],
  )

  const createNewVault = useCallback(async () => {
    if (!name) {
      nameInputRef.current?.focus()
      return
    }

    if (passwordType === KeySystemPasswordType.UserInputted) {
      if (!customPassword) {
        throw new Error('Custom key is not set')
      }
      await application.vaults.createUserInputtedPasswordVault({
        name,
        description,
        storagePreference: keyStorageMode,
        userInputtedPassword: customPassword,
      })
    } else {
      await application.vaults.createRandomizedVault({
        name,
        description,
      })
    }

    handleDialogClose()
  }, [application.vaults, customPassword, description, handleDialogClose, keyStorageMode, name, passwordType])

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) {
      return
    }
    setIsSubmitting(true)
    if (existingVault) {
      await saveExistingVault(existingVault)
    } else {
      await createNewVault()
    }
    setIsSubmitting(false)
  }, [isSubmitting, existingVault, saveExistingVault, createNewVault])

  const modalActions = useMemo(
    (): ModalAction[] => [
      {
        label: existingVault ? 'Save Vault' : 'Create Vault',
        onClick: handleSubmit,
        type: 'primary',
        mobileSlot: 'right',
        disabled: isSubmitting,
      },
      {
        label: 'Cancel',
        onClick: handleDialogClose,
        type: 'cancel',
        mobileSlot: 'left',
      },
    ],
    [existingVault, handleDialogClose, handleSubmit, isSubmitting],
  )

  if (existingVault && application.vaultLocks.isVaultLocked(existingVault)) {
    return <div>Vault is locked.</div>
  }

  return (
    <Modal title={existingVault ? 'Edit Vault' : 'Create New Vault'} close={handleDialogClose} actions={modalActions}>
      <div className="px-4.5 pb-1.5 pt-4">
        <div className="flex w-full flex-col">
          <div className="mb-3">
            <div className="text-lg">Vault Info</div>
            <div className="mt-1">The vault name and description are end-to-end encrypted.</div>

            <DecoratedInput
              className={{ container: 'mt-4' }}
              ref={nameInputRef}
              value={name}
              placeholder="Vault Name"
              onChange={(value) => {
                setName(value)
              }}
            />

            <DecoratedInput
              className={{ container: 'mt-4' }}
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

          <PasswordTypePreference
            value={passwordType}
            onChange={setPasswordType}
            onCustomKeyChange={setCustomPassword}
          />

          <KeyStoragePreference value={keyStorageMode} onChange={setKeyStorageMode} />
        </div>
      </div>
    </Modal>
  )
}

export default EditVaultModal
