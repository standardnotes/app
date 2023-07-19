import { FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react'
import Modal, { ModalAction } from '@/Components/Modal/Modal'
import { useApplication } from '@/Components/ApplicationProvider'
import { ContactPublicKeySet } from '@standardnotes/snjs'
import Button from '@/Components/Button/Button'

type Props = {
  onCloseDialog: () => void
}

const KeyManagementModal: FunctionComponent<Props> = ({ onCloseDialog }) => {
  const application = useApplication()

  const [keySets, setKeySets] = useState<ContactPublicKeySet[]>([])

  const selfContact = application.contacts.getSelfContact()

  useEffect(() => {
    if (!selfContact) {
      return
    }
    const allKeySets: ContactPublicKeySet[] = []
    let currentKeySet: ContactPublicKeySet | undefined = selfContact.publicKeySet
    while (currentKeySet) {
      allKeySets.push(currentKeySet)
      currentKeySet = currentKeySet.previousKeySet
    }
    setKeySets(allKeySets)
  }, [selfContact])

  const revokeKeySet = useCallback(
    async (keySet: ContactPublicKeySet) => {
      if (!selfContact) {
        return
      }

      const confirmed = await application.alerts.confirmV2({
        title: 'Revoke Public Key',
        text: 'Are you sure you want to revoke this public key set? Your contacts will treat this key as untrusted, and refuse any data that is encrypted or signed with it.',
      })

      if (!confirmed) {
        return
      }

      await application.sharedVaults.revokeOwnKeySet(keySet)
    },
    [application, selfContact],
  )

  const handleDialogClose = useCallback(() => {
    onCloseDialog()
  }, [onCloseDialog])

  const modalActions = useMemo(
    (): ModalAction[] => [
      {
        label: 'Close',
        onClick: handleDialogClose,
        type: 'cancel',
        mobileSlot: 'left',
      },
    ],
    [handleDialogClose],
  )

  if (!selfContact) {
    return null
  }

  return (
    <Modal title={'Manage Public Keys'} close={handleDialogClose} actions={modalActions}>
      <div className="px-4.5 pb-1.5 pt-4">
        <div className="flex w-full flex-col">
          {keySets.map((keySet, index) => {
            return (
              <div className="my-2 flex flex-col gap-1" key={index}>
                <div>Public Key: {keySet.encryption}</div>
                <div>Signing Public Key: {keySet.signing}</div>
                <div>Created At: {keySet.timestamp.toLocaleString()}</div>
                {keySet.isRevoked ? (
                  <div className="text-danger">Revoked</div>
                ) : (
                  <Button label="Revoke" className={'mr-3 text-xs'} onClick={() => revokeKeySet(keySet)} />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </Modal>
  )
}

export default KeyManagementModal
