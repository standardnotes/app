import { observer } from 'mobx-react-lite'
import { useCallback, useMemo } from 'react'
import ImportModalFileItem from './ImportModalFileItem'
import ImportModalInitialPage from './InitialPage'
import Modal, { ModalAction } from '../Modal/Modal'
import ModalOverlay from '../Modal/ModalOverlay'
import { ImportModalController } from '@/Components/ImportModal/ImportModalController'
import { useApplication } from '../ApplicationProvider'
import Switch from '../Switch/Switch'
import LinkedItemBubble from '../LinkedItems/LinkedItemBubble'
import { createLinkFromItem } from '@/Utils/Items/Search/createLinkFromItem'
import ItemSelectionDropdown from '../ItemSelectionDropdown/ItemSelectionDropdown'
import { ContentType, SNTag } from '@standardnotes/snjs'
import Button from '../Button/Button'
import { ClassicFileReader } from '@standardnotes/filepicker'

const ImportModal = ({ importModalController }: { importModalController: ImportModalController }) => {
  const application = useApplication()

  const {
    files,
    setFiles,
    addFiles,
    addImportsToTag,
    setAddImportsToTag,
    shouldCreateTag,
    setShouldCreateTag,
    existingTagForImports,
    setExistingTagForImports,
    updateFile,
    removeFile,
    parseAndImport,
    isVisible,
    close,
  } = importModalController

  const isReadyToImport = files.length > 0 && files.every((file) => file.status === 'pending' && file.service)
  const importSuccessOrError =
    files.length > 0 && files.every((file) => file.status === 'finished' || file.status === 'error')

  const modalActions: ModalAction[] = useMemo(
    () => [
      {
        label: 'Import',
        type: 'primary',
        onClick: parseAndImport,
        hidden: !isReadyToImport,
        mobileSlot: 'right',
        disabled: !isReadyToImport || (!shouldCreateTag && !existingTagForImports),
      },
      {
        label: importSuccessOrError ? 'Close' : 'Cancel',
        type: 'cancel',
        onClick: close,
        mobileSlot: 'left',
      },
    ],
    [close, existingTagForImports, importSuccessOrError, isReadyToImport, parseAndImport, shouldCreateTag],
  )

  const selectFiles = useCallback(
    async (service?: string) => {
      const files = await ClassicFileReader.selectFiles()

      addFiles(files, service)
    },
    [addFiles],
  )

  return (
    <ModalOverlay isOpen={isVisible} close={close}>
      <Modal title="Import" close={close} actions={modalActions} className="flex flex-col">
        <div className="min-h-0 flex-grow overflow-y-auto px-4 py-4">
          {!files.length && <ImportModalInitialPage setFiles={setFiles} selectFiles={selectFiles} />}
          {files.length > 0 && (
            <>
              <div className="divide-y divide-border">
                {files.map((file) => (
                  <ImportModalFileItem
                    file={file}
                    key={file.id}
                    updateFile={updateFile}
                    removeFile={removeFile}
                    importer={application.importer}
                  />
                ))}
              </div>
              {!importSuccessOrError && (
                <Button
                  className="mt-4"
                  onClick={() => {
                    selectFiles().catch(console.error)
                  }}
                  small
                >
                  Add files
                </Button>
              )}
            </>
          )}
        </div>
        {files.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-border px-4 py-4 md:gap-2 md:py-3">
            <Switch className="flex items-center gap-2" checked={addImportsToTag} onChange={setAddImportsToTag}>
              <span className="text-sm">Add all imported notes to tag</span>
            </Switch>
            {addImportsToTag && (
              <>
                <label className="mt-1.5 flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="import-tag"
                    className="h-6 w-6 md:h-4 md:w-4"
                    checked={shouldCreateTag}
                    onChange={() => {
                      setShouldCreateTag(true)
                    }}
                  />
                  Create new tag
                </label>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="import-tag"
                        className="h-6 w-6 md:h-4 md:w-4"
                        checked={!shouldCreateTag}
                        onChange={() => {
                          setShouldCreateTag(false)
                        }}
                      />
                      Add to existing tag
                    </label>
                    {existingTagForImports && (
                      <LinkedItemBubble
                        className="m-1 mr-2"
                        link={createLinkFromItem(existingTagForImports, 'linked')}
                        unlinkItem={async () => {
                          setExistingTagForImports(undefined)
                        }}
                        isBidirectional={false}
                        inlineFlex={true}
                      />
                    )}
                  </div>
                  {!shouldCreateTag && (
                    <div className="ml-8 md:ml-6">
                      <ItemSelectionDropdown
                        onSelection={(tag) => setExistingTagForImports(tag as SNTag)}
                        placeholder="Select tag to add imported notes to..."
                        contentTypes={[ContentType.TYPES.Tag]}
                      />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </ModalOverlay>
  )
}

export default observer(ImportModal)
