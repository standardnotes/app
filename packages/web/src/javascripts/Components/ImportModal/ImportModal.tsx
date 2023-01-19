import { ViewControllerManager } from '@/Controllers/ViewControllerManager'
import { ContentType, DecryptedTransferPayload, pluralize, SNTag, TagContent, UuidGenerator } from '@standardnotes/snjs'
import { Importer } from '@standardnotes/ui-services'
import { observer } from 'mobx-react-lite'
import { useCallback, useReducer, useState } from 'react'
import { useApplication } from '../ApplicationProvider'
import Button from '../Button/Button'
import { useStateRef } from '@/Hooks/useStateRef'
import ModalDialog from '../Shared/ModalDialog'
import ModalDialogButtons from '../Shared/ModalDialogButtons'
import ModalDialogDescription from '../Shared/ModalDialogDescription'
import ModalDialogLabel from '../Shared/ModalDialogLabel'
import { ImportModalFileItem } from './ImportModalFileItem'
import ImportModalInitialPage from './InitialPage'
import { ImportModalAction, ImportModalFile, ImportModalState } from './Types'

const reducer = (state: ImportModalState, action: ImportModalAction): ImportModalState => {
  switch (action.type) {
    case 'setFiles':
      return {
        ...state,
        files: action.files.map((file) => ({
          id: UuidGenerator.GenerateUuid(),
          file,
          status: action.service ? 'ready' : 'pending',
          service: action.service,
        })),
      }
    case 'updateFile':
      return {
        ...state,
        files: state.files.map((file) => {
          if (file.file.name === action.file.file.name) {
            return action.file
          }
          return file
        }),
      }
    case 'removeFile':
      return {
        ...state,
        files: state.files.filter((file) => file.id !== action.id),
      }
    case 'setImportTag':
      return {
        ...state,
        importTag: action.tag,
      }
    case 'clearState':
      return {
        files: [],
      }
  }
}

const initialState: ImportModalState = {
  files: [],
}

const ImportModal = ({ viewControllerManager }: { viewControllerManager: ViewControllerManager }) => {
  const application = useApplication()
  const [importer] = useState(() => new Importer(application))
  const [state, dispatch] = useReducer(reducer, initialState)
  const { files } = state
  const filesRef = useStateRef(files)

  const importFromPayloads = useCallback(
    async (file: ImportModalFile, payloads: DecryptedTransferPayload[]) => {
      dispatch({
        type: 'updateFile',
        file: {
          ...file,
          status: 'importing',
        },
      })

      try {
        await importer.importFromTransferPayloads(payloads)

        const notesImported = payloads.filter((payload) => payload.content_type === ContentType.Note)
        const tagsImported = payloads.filter((payload) => payload.content_type === ContentType.Tag)

        const successMessage =
          `Successfully imported ${notesImported.length} ` +
          pluralize(notesImported.length, 'note', 'notes') +
          (tagsImported.length > 0
            ? ` and ${tagsImported.length} ${pluralize(tagsImported.length, 'tag', 'tags')}`
            : '')

        dispatch({
          type: 'updateFile',
          file: {
            ...file,
            status: 'success',
            successMessage,
          },
        })
      } catch (error) {
        dispatch({
          type: 'updateFile',
          file: {
            ...file,
            status: 'error',
            error: error instanceof Error ? error : new Error('Could not import file'),
          },
        })
      }
    },
    [importer],
  )

  const parseAndImport = useCallback(async () => {
    const files = filesRef.current
    if (files.length === 0) {
      return
    }
    const importedPayloads: DecryptedTransferPayload[] = []
    for (const file of files) {
      if (!file.service) {
        return
      }

      if (file.status === 'ready' && file.payloads) {
        await importFromPayloads(file, file.payloads)
        importedPayloads.push(...file.payloads)
        continue
      }

      dispatch({
        type: 'updateFile',
        file: {
          ...file,
          status: 'parsing',
        },
      })

      try {
        const payloads = await importer.getPayloadsFromFile(file.file, file.service)
        await importFromPayloads(file, payloads)
        importedPayloads.push(...payloads)
      } catch (error) {
        dispatch({
          type: 'updateFile',
          file: {
            ...file,
            status: 'error',
            error: error instanceof Error ? error : new Error('Could not import file'),
          },
        })
      }
    }
    const currentDate = new Date()
    const importTagPayload: DecryptedTransferPayload<TagContent> = {
      uuid: UuidGenerator.GenerateUuid(),
      created_at: currentDate,
      created_at_timestamp: currentDate.getTime(),
      updated_at: currentDate,
      updated_at_timestamp: currentDate.getTime(),
      content_type: ContentType.Tag,
      content: {
        title: `Imported on ${currentDate.toLocaleString()}`,
        expanded: false,
        iconString: '',
        references: importedPayloads
          .filter((payload) => payload.content_type === ContentType.Note)
          .map((payload) => ({
            content_type: ContentType.Note,
            uuid: payload.uuid,
          })),
      },
    }
    const [importTag] = await importer.importFromTransferPayloads([importTagPayload])
    if (importTag) {
      dispatch({
        type: 'setImportTag',
        tag: importTag as SNTag,
      })
    }
  }, [filesRef, importFromPayloads, importer])

  const closeDialog = useCallback(() => {
    viewControllerManager.isImportModalVisible.set(false)
    if (state.importTag) {
      void viewControllerManager.navigationController.setSelectedTag(state.importTag, 'all', {
        userTriggered: true,
      })
    }
    dispatch({
      type: 'clearState',
    })
  }, [state.importTag, viewControllerManager.isImportModalVisible, viewControllerManager.navigationController])

  return (
    <ModalDialog isOpen={viewControllerManager.isImportModalVisible.get()} onDismiss={closeDialog}>
      <ModalDialogLabel closeDialog={closeDialog}>Import</ModalDialogLabel>
      <ModalDialogDescription>
        {!files.length && <ImportModalInitialPage dispatch={dispatch} />}
        {files.length > 0 && (
          <div className="divide-y divide-border">
            {files.map((file) => (
              <ImportModalFileItem file={file} key={file.id} dispatch={dispatch} importer={importer} />
            ))}
          </div>
        )}
      </ModalDialogDescription>
      <ModalDialogButtons>
        {files.length > 0 && files.every((file) => file.status === 'ready') && (
          <Button primary onClick={parseAndImport}>
            Import
          </Button>
        )}
        <Button onClick={closeDialog}>
          {files.length > 0 && files.every((file) => file.status === 'success' || file.status === 'error')
            ? 'Close'
            : 'Cancel'}
        </Button>
      </ModalDialogButtons>
    </ModalDialog>
  )
}

export default observer(ImportModal)
