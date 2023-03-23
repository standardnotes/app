import { useCallback, useEffect, useRef, useState } from 'react'
import { useApplication } from '../ApplicationProvider'
import Icon from '../Icon/Icon'
import { confirmDialog } from '@standardnotes/ui-services'
import { BlocksEditorComposer } from '../SuperEditor/BlocksEditorComposer'
import { BlocksEditor } from '../SuperEditor/BlocksEditor'
import { SNNote } from '@standardnotes/snjs'
import { NoteSyncController } from '@/Controllers/NoteSyncController'
import LinkedItemBubblesContainer from '../LinkedItems/LinkedItemBubblesContainer'
import { LinkingController } from '@/Controllers/LinkingController'
import Button from '../Button/Button'

const ClippedNoteView = ({
  note,
  linkingController,
  clearClip,
}: {
  note: SNNote
  linkingController: LinkingController
  clearClip: () => void
}) => {
  const application = useApplication()

  const syncController = useRef(new NoteSyncController(application, note))
  useEffect(() => {
    const currentController = syncController.current
    return () => {
      currentController.deinit()
    }
  }, [])

  const [title, setTitle] = useState(() => note.title)
  useEffect(() => {
    void syncController.current.saveAndAwaitLocalPropagation({
      title,
      isUserModified: true,
      dontGeneratePreviews: true,
    })
  }, [application.items, title])

  const handleChange = useCallback(async (value: string, preview: string) => {
    void syncController.current.saveAndAwaitLocalPropagation({
      text: value,
      isUserModified: true,
      previews: {
        previewPlain: preview,
        previewHtml: undefined,
      },
    })
  }, [])

  const discardNote = useCallback(async () => {
    if (
      await confirmDialog({
        text: 'Are you sure you want to discard this clip?',
        confirmButtonText: 'Discard',
        confirmButtonStyle: 'danger',
      })
    ) {
      void application.mutator.deleteItem(note)
      clearClip()
    }
  }, [application.mutator, clearClip, note])

  return (
    <div className="">
      <div className="border-b border-border p-3">
        <div className="mb-3 flex w-full items-center gap-3">
          <Button className="flex items-center justify-center" fullWidth onClick={clearClip}>
            <Icon type="arrow-left" className="mr-2" />
            Back
          </Button>
          <Button
            className="flex items-center justify-center"
            fullWidth
            primary
            colorStyle="danger"
            onClick={discardNote}
          >
            <Icon type="trash-filled" className="mr-2" />
            Discard
          </Button>
        </div>
        <input
          className="w-full text-base font-semibold"
          type="text"
          value={title}
          onChange={(event) => {
            setTitle(event.target.value)
          }}
        />
        <LinkedItemBubblesContainer linkingController={linkingController} item={note} hideToggle />
      </div>
      <div className="p-3">
        <BlocksEditorComposer initialValue={note.text}>
          <BlocksEditor onChange={handleChange}></BlocksEditor>
        </BlocksEditorComposer>
      </div>
    </div>
  )
}

export default ClippedNoteView
