import { INSERT_FILE_COMMAND } from '../Commands'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'

import { useEffect, useState } from 'react'
import { FileNode } from './Nodes/FileNode'
import {
  $createParagraphNode,
  $insertNodes,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_NORMAL,
  PASTE_COMMAND,
  $isRootOrShadowRoot,
  createCommand,
} from 'lexical'
import { $createFileNode } from './Nodes/FileUtils'
import { mergeRegister, $wrapNodeInElement } from '@lexical/utils'
import { useFilesController } from '@/Controllers/FilesControllerProvider'
import { FilesControllerEvent } from '@/Controllers/FilesController'
import { useLinkingController } from '@/Controllers/LinkingControllerProvider'
import { useApplication } from '@/Components/ApplicationProvider'
import { SNNote } from '@standardnotes/snjs'
import Spinner from '../../../Spinner/Spinner'
import Modal from '../../Lexical/UI/Modal'
import Button from '@/Components/Button/Button'
import { isMobileScreen } from '../../../../Utils'

export const OPEN_FILE_UPLOAD_MODAL_COMMAND = createCommand('OPEN_FILE_UPLOAD_MODAL_COMMAND')

function UploadFileDialog({ currentNote, onClose }: { currentNote: SNNote; onClose: () => void }) {
  const application = useApplication()
  const [editor] = useLexicalComposerContext()
  const filesController = useFilesController()
  const linkingController = useLinkingController()

  const [file, setFile] = useState<File>()
  const [isUploadingFile, setIsUploadingFile] = useState(false)

  const onClick = () => {
    if (!file) {
      return
    }

    setIsUploadingFile(true)
    filesController
      .uploadNewFile(file)
      .then((uploadedFile) => {
        if (!uploadedFile) {
          return
        }
        editor.dispatchCommand(INSERT_FILE_COMMAND, uploadedFile.uuid)
        void linkingController.linkItemToSelectedItem(uploadedFile)
        void application.changeAndSaveItem.execute(uploadedFile, (mutator) => {
          mutator.protected = currentNote.protected
        })
      })
      .catch(console.error)
      .finally(() => {
        setIsUploadingFile(false)
        onClose()
      })
  }

  return (
    <>
      <input
        type="file"
        onChange={(event) => {
          const filesList = event.target.files
          if (filesList && filesList.length === 1) {
            setFile(filesList[0])
          }
        }}
      />
      <div className="mt-1.5 flex justify-end">
        {isUploadingFile ? (
          <Spinner className="h-4 w-4" />
        ) : (
          <Button onClick={onClick} disabled={!file} small={isMobileScreen()}>
            Upload
          </Button>
        )}
      </div>
    </>
  )
}

export default function FilePlugin({ currentNote }: { currentNote: SNNote }): JSX.Element | null {
  const application = useApplication()
  const [editor] = useLexicalComposerContext()
  const filesController = useFilesController()
  const linkingController = useLinkingController()

  const [showFileUploadModal, setShowFileUploadModal] = useState(false)

  useEffect(() => {
    if (!editor.hasNodes([FileNode])) {
      throw new Error('FilePlugin: FileNode not registered on editor')
    }

    const uploadFilesList = (files: FileList) => {
      Array.from(files).forEach(async (file) => {
        try {
          const uploadedFile = await filesController.uploadNewFile(file)
          if (uploadedFile) {
            editor.dispatchCommand(INSERT_FILE_COMMAND, uploadedFile.uuid)
            void linkingController.linkItemToSelectedItem(uploadedFile)
            void application.changeAndSaveItem.execute(uploadedFile, (mutator) => {
              mutator.protected = currentNote.protected
            })
          }
        } catch (error) {
          console.error(error)
        }
      })
    }

    return mergeRegister(
      editor.registerCommand<string>(
        INSERT_FILE_COMMAND,
        (payload) => {
          const fileNode = $createFileNode(payload)
          $insertNodes([fileNode])
          if ($isRootOrShadowRoot(fileNode.getParentOrThrow())) {
            $wrapNodeInElement(fileNode, $createParagraphNode).selectEnd()
          }
          const newLineNode = $createParagraphNode()
          fileNode.getParentOrThrow().insertAfter(newLineNode)

          return true
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand(
        OPEN_FILE_UPLOAD_MODAL_COMMAND,
        () => {
          setShowFileUploadModal(true)
          return true
        },
        COMMAND_PRIORITY_NORMAL,
      ),
      editor.registerCommand(
        PASTE_COMMAND,
        (payload) => {
          const files = payload instanceof ClipboardEvent ? payload.clipboardData?.files : null
          if (files?.length) {
            uploadFilesList(files)
            return true
          }
          return false
        },
        COMMAND_PRIORITY_NORMAL,
      ),
      editor.registerNodeTransform(FileNode, (node) => {
        /**
         * When adding the node we wrap it with a paragraph to avoid insertion errors,
         * however that causes issues with selection. We unwrap the node to fix that.
         */
        const parent = node.getParent()
        if (!parent) {
          return
        }
        if (parent.getChildrenSize() === 1) {
          parent.insertBefore(node)
          parent.remove()
        }
      }),
    )
  }, [application, currentNote.protected, editor, filesController, linkingController])

  useEffect(() => {
    const disposer = filesController.addEventObserver((event, data) => {
      if (event === FilesControllerEvent.FileUploadedToNote) {
        const fileUuid = data[FilesControllerEvent.FileUploadedToNote].uuid
        editor.dispatchCommand(INSERT_FILE_COMMAND, fileUuid)
      }
    })

    return disposer
  }, [filesController, editor])

  if (showFileUploadModal) {
    return (
      <Modal onClose={() => setShowFileUploadModal(false)} title="Upload File">
        <UploadFileDialog currentNote={currentNote} onClose={() => setShowFileUploadModal(false)} />
      </Modal>
    )
  }

  return null
}
