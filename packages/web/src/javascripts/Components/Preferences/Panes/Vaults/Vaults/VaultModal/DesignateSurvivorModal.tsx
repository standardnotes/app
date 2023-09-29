import { useApplication } from '@/Components/ApplicationProvider'
import Modal, { ModalAction } from '@/Components/Modal/Modal'
import Spinner from '@/Components/Spinner/Spinner'
import { SharedVaultUserServerHash, VaultListingInterface } from '@standardnotes/snjs'
import { useCallback, useMemo, useState } from 'react'

const DesignateSurvivorModal = ({
  vault,
  members,
  closeModal,
}: {
  vault: VaultListingInterface
  members: SharedVaultUserServerHash[]
  closeModal: () => void
}) => {
  const application = useApplication()
  const [selectedSurvivor, setSelectedSurvivor] = useState<SharedVaultUserServerHash | null>(null)
  const [isDesignating, setIsDesignating] = useState(false)

  const designateSelectedSurvivor = useCallback(async () => {
    if (!selectedSurvivor) {
      return
    }

    if (!vault.isSharedVaultListing()) {
      return
    }

    try {
      setIsDesignating(true)
      const result = await application.vaultUsers.designateSurvivor(vault, selectedSurvivor.user_uuid)
      if (result.isFailed()) {
        throw new Error(result.getError())
      }
      await application.sync.sync()
      closeModal()
    } catch (error) {
      console.error(error)
    } finally {
      setIsDesignating(false)
    }
  }, [application.sync, application.vaultUsers, closeModal, selectedSurvivor, vault])

  const modalActions = useMemo(
    (): ModalAction[] => [
      {
        label: isDesignating ? <Spinner className="h-5 w-5 border-info-contrast" /> : 'Designate survivor',
        onClick: designateSelectedSurvivor,
        type: 'primary',
        mobileSlot: 'right',
        disabled: !selectedSurvivor || isDesignating,
        hidden: members.length === 0,
      },
      {
        label: 'Cancel',
        onClick: closeModal,
        type: 'cancel',
        mobileSlot: 'left',
      },
    ],
    [closeModal, designateSelectedSurvivor, isDesignating, members.length, selectedSurvivor],
  )

  return (
    <Modal title="Designate survivor" close={closeModal} actions={modalActions} className="px-4.5 py-4">
      <div className="flex flex-col gap-3">
        {members.map((member) => {
          const isSelected = selectedSurvivor?.uuid === member.uuid
          const contact = application.contacts.findContactForServerUser(member)
          if (!contact) {
            return null
          }
          const isOwner = application.vaultUsers.isVaultUserOwner(member)
          if (isOwner) {
            return null
          }
          return (
            <label className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5" key={member.uuid}>
              <input
                className="h-4 w-4 self-center accent-info"
                type="radio"
                name="survivor"
                checked={isSelected}
                onClick={() => setSelectedSurvivor(member)}
              />
              <div className="col-start-2 text-sm font-semibold">{contact.name}</div>
              <div className="col-start-2 opacity-90">{contact.contactUuid}</div>
            </label>
          )
        })}
      </div>
    </Modal>
  )
}

export default DesignateSurvivorModal
