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
  VectorIconNameOrEmoji,
  isClientDisplayableError,
} from '@standardnotes/snjs'
import { VaultModalMembers } from './VaultModalMembers'
import { VaultModalInvites } from './VaultModalInvites'
import { PasswordTypePreference } from './PasswordTypePreference'
import { KeyStoragePreference } from './KeyStoragePreference'
import useItem from '@/Hooks/useItem'
import Button from '@/Components/Button/Button'
import Icon from '@/Components/Icon/Icon'
import StyledTooltip from '@/Components/StyledTooltip/StyledTooltip'
import Popover from '@/Components/Popover/Popover'
import IconPicker from '@/Components/Icon/IconPicker'

type Props = {
  existingVaultUuid?: string
  onCloseDialog: () => void
}

const EditVaultModal: FunctionComponent<Props> = ({ onCloseDialog, existingVaultUuid }) => {
  const application = useApplication()

  const existingVault = useItem<VaultListingInterface>(existingVaultUuid)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [iconString, setIconString] = useState<VectorIconNameOrEmoji>('safe-square')
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
      setIconString(existingVault.iconString)
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

      if (vault.name !== name || vault.description !== description || vault.iconString !== iconString) {
        await application.vaults.changeVaultMetadata(vault, {
          name: name,
          description: description,
          iconString: iconString,
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
    [
      application.vaults,
      customPassword,
      description,
      handleDialogClose,
      iconString,
      keyStorageMode,
      name,
      passwordType,
    ],
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
        iconString: iconString,
        storagePreference: keyStorageMode,
        userInputtedPassword: customPassword,
      })
    } else {
      await application.vaults.createRandomizedVault({
        name,
        description,
        iconString: iconString,
      })
    }

    handleDialogClose()
  }, [
    application.vaults,
    customPassword,
    description,
    handleDialogClose,
    iconString,
    keyStorageMode,
    name,
    passwordType,
  ])

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

  const [shouldShowIconPicker, setShouldShowIconPicker] = useState(false)
  const iconPickerButtonRef = useRef<HTMLButtonElement>(null)
  const toggleIconPicker = useCallback(() => {
    setShouldShowIconPicker((shouldShow) => !shouldShow)
  }, [])

  const canShowMembers =
    members.length > 0 && !members.every((member) => application.vaultUsers.isVaultUserOwner(member))

  if (existingVault && application.vaultLocks.isVaultLocked(existingVault)) {
    return <div>Vault is locked.</div>
  }

  return (
    <Modal title={existingVault ? 'Edit Vault' : 'Create New Vault'} close={handleDialogClose} actions={modalActions}>
      <div className="px-4.5 pb-1.5 pt-4 flex w-full flex-col">
        <div className="mb-3">
          <div className="text-lg">Vault Info</div>
          <div className="mt-1">The vault name and description are end-to-end encrypted.</div>

          <div className="flex items-center mt-4 gap-4">
            <StyledTooltip className="!z-modal" label="Choose icon">
              <Button className="!px-1.5" ref={iconPickerButtonRef} onClick={toggleIconPicker}>
                <Icon type={iconString} />
              </Button>
            </StyledTooltip>
            <Popover
              title="Choose icon"
              open={shouldShowIconPicker}
              anchorElement={iconPickerButtonRef}
              togglePopover={toggleIconPicker}
              align="start"
              overrideZIndex="z-modal"
              hideOnClickInModal
            >
              <div className="p-2">
                <IconPicker
                  selectedValue={iconString || 'safe-square'}
                  onIconChange={(value?: VectorIconNameOrEmoji) => {
                    setIconString(value ?? 'safe-square')
                    toggleIconPicker()
                  }}
                  platform={application.platform}
                  useIconGrid={true}
                />
              </div>
            </Popover>
            <DecoratedInput
              className={{
                container: 'flex-grow',
              }}
              ref={nameInputRef}
              value={name}
              placeholder="Vault Name"
              onChange={(value) => {
                setName(value)
              }}
            />
          </div>

          <DecoratedInput
            className={{ container: 'mt-4' }}
            value={description}
            placeholder="Vault description"
            onChange={(value) => {
              setDescription(value)
            }}
          />
        </div>

        {existingVault && canShowMembers && (
          <VaultModalMembers vault={existingVault} members={members} onChange={reloadVaultInfo} isAdmin={isAdmin} />
        )}

        {existingVault && invites.length > 0 && (
          <VaultModalInvites invites={invites} onChange={reloadVaultInfo} isAdmin={isAdmin} />
        )}

        <PasswordTypePreference value={passwordType} onChange={setPasswordType} onCustomKeyChange={setCustomPassword} />

        <KeyStoragePreference value={keyStorageMode} onChange={setKeyStorageMode} />
      </div>
    </Modal>
  )
}

export default EditVaultModal
