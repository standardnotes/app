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
import Spinner from '../Spinner/Spinner'

const ClippedNoteView = ({
  note,
  linkingController,
  clearClip,
  isFirefoxPopup,
}: {
  note: SNNote
  linkingController: LinkingController
  clearClip: () => void
  isFirefoxPopup: boolean
}) => {
  const application = useApplication()

  const syncController = useRef(
    new NoteSyncController(
      note,
      application.items,
      application.mutator,
      application.sessions,
      application.sync,
      application.alerts,
      application.isNativeMobileWebUseCase,
    ),
  )
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

  const [isDiscarding, setIsDiscarding] = useState(false)
  const discardNote = useCallback(async () => {
    if (
      await confirmDialog({
        text: 'Are you sure you want to discard this clip?',
        confirmButtonText: 'Discard',
        confirmButtonStyle: 'danger',
      })
    ) {
      setIsDiscarding(true)
      application.mutator
        .deleteItem(note)
        .then(() => application.sync.sync())
        .then(() => {
          if (isFirefoxPopup) {
            window.close()
          }
          clearClip()
        })
        .catch(console.error)
        .finally(() => setIsDiscarding(false))
    }
  }, [application.mutator, application.sync, clearClip, isFirefoxPopup, note])

  return (
    <div className="">
      <div className="border-b border-border p-3">
        <div className="mb-3 flex w-full items-center gap-3">
          {!isFirefoxPopup && (
            <Button className="flex items-center justify-center" fullWidth onClick={clearClip} disabled={isDiscarding}>
              <Icon type="arrow-left" className="mr-2" />
              Back
            </Button>
          )}
          <Button
            className="flex items-center justify-center"
            fullWidth
            primary
            colorStyle="danger"
            onClick={discardNote}
            disabled={isDiscarding}
          >
            {isDiscarding ? (
              <Spinner className="h-6 w-6 text-danger-contrast" />
            ) : (
              <>
                <Icon type="trash-filled" className="mr-2" />
                Discard
              </>
            )}
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
