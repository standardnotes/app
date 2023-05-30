import { observer } from 'mobx-react-lite'
import { useMemo } from 'react'
import ImportModalFileItem from './ImportModalFileItem'
import ImportModalInitialPage from './InitialPage'
import Modal, { ModalAction } from '../Modal/Modal'
import ModalOverlay from '../Modal/ModalOverlay'
import { ImportModalController } from '@/Controllers/ImportModalController'

const ImportModal = ({ importModalController }: { importModalController: ImportModalController }) => {
  const { files, setFiles, updateFile, removeFile, importer, parseAndImport, isVisible, close } = importModalController

  const isReadyToImport = files.length > 0 && files.every((file) => file.status === 'ready')
  const importSuccessOrError =
    files.length > 0 && files.every((file) => file.status === 'success' || file.status === 'error')

  const modalActions: ModalAction[] = useMemo(
    () => [
      {
        label: 'Import',
        type: 'primary',
        onClick: parseAndImport,
        hidden: !isReadyToImport,
        mobileSlot: 'right',
      },
      {
        label: importSuccessOrError ? 'Close' : 'Cancel',
        type: 'cancel',
        onClick: close,
        mobileSlot: 'left',
      },
    ],
    [close, importSuccessOrError, isReadyToImport, parseAndImport],
  )

  return (
    <ModalOverlay isOpen={isVisible} close={close}>
      <Modal title="Import" close={close} actions={modalActions}>
        <div className="px-4 py-4">
          {!files.length && <ImportModalInitialPage setFiles={setFiles} />}
          {files.length > 0 && (
            <div className="divide-y divide-border">
              {files.map((file) => (
                <ImportModalFileItem
                  file={file}
                  key={file.id}
                  updateFile={updateFile}
                  removeFile={removeFile}
                  importer={importer}
                />
              ))}
            </div>
          )}
        </div>
      </Modal>
    </ModalOverlay>
  )
}

export default observer(ImportModal)
