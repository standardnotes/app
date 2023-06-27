import { ContentType, NoteContent, NoteType, SNNote, spaceSeparatedStrings } from '@standardnotes/snjs'
import { useCallback, useEffect, useMemo } from 'react'
import { useApplication } from '../ApplicationProvider'
import ComponentView from '../ComponentView/ComponentView'
import Icon from '../Icon/Icon'
import Modal, { ModalAction } from '../Modal/Modal'
import { EditorMenuItem } from '../NotesOptions/EditorMenuItem'
import { NoteViewController } from '../NoteView/Controller/NoteViewController'
import { HeadlessSuperConverter } from './Tools/HeadlessSuperConverter'

const SuperNoteConverter = ({
  note,
  convertTo,
  closeDialog,
  onComplete,
}: {
  note: SNNote
  convertTo: EditorMenuItem
  closeDialog: () => void
  onComplete: () => void
}) => {
  const application = useApplication()
  const { name, noteType, component } = convertTo

  const format = useMemo(() => {
    if (component && component.package_info.file_type) {
      return component.package_info.file_type
    }

    if (noteType === NoteType.Markdown) {
      return 'md'
    }

    if (noteType === NoteType.RichText) {
      return 'html'
    }

    if (noteType === NoteType.Plain) {
      return 'txt'
    }

    return 'json'
  }, [component, noteType])

  const convertedContent = useMemo(() => {
    if (note.text.length === 0) {
      return note.text
    }

    return new HeadlessSuperConverter().convertString(note.text, format)
  }, [format, note])

  const componentViewer = useMemo(() => {
    if (!component) {
      return undefined
    }

    const templateNoteForRevision = application.items.createTemplateItem<NoteContent, SNNote>(ContentType.Note, {
      title: note.title,
      text: convertedContent,
      references: note.references,
    })

    const componentViewer = application.componentManager.createComponentViewer(component)
    componentViewer.setReadonly(true)
    componentViewer.lockReadonly = true
    componentViewer.overrideContextItem = templateNoteForRevision
    return componentViewer
  }, [application.componentManager, application.mutator, component, convertedContent, note.references, note.title])

  useEffect(() => {
    return () => {
      if (componentViewer) {
        application.componentManager.destroyComponentViewer(componentViewer)
      }
    }
  }, [application.componentManager, componentViewer])

  const performConvert = useCallback(
    async (text: string) => {
      const controller = new NoteViewController(application, note)
      await controller.initialize()
      await controller.saveAndAwaitLocalPropagation({
        text,
        isUserModified: true,
        bypassDebouncer: true,
      })
    },
    [application, note],
  )

  const confirmConvert = useCallback(async () => {
    await performConvert(convertedContent)
    onComplete()
    closeDialog()
  }, [closeDialog, convertedContent, onComplete, performConvert])

  const isSeamlessConvert = note.text.length === 0
  useEffect(() => {
    if (isSeamlessConvert) {
      void confirmConvert()
    }
  }, [isSeamlessConvert, confirmConvert])

  const convertAsIs = useCallback(async () => {
    const confirmed = await application.alertService.confirm(
      spaceSeparatedStrings(
        "This option is useful if you want to edit the note's content which is in Super's JSON format directly.",
        'This format is not human-readable. If you want to convert the note to a human-readable format, please use the "Convert" option instead.',
      ),
      'Are you sure?',
    )
    if (!confirmed) {
      return
    }

    closeDialog()

    await performConvert(note.text)

    onComplete()
  }, [closeDialog, application, note, onComplete, performConvert])

  const modalActions = useMemo(
    (): ModalAction[] => [
      {
        label: 'Cancel',
        onClick: closeDialog,
        type: 'cancel',
        mobileSlot: 'left',
      },
      {
        label: 'Convert',
        onClick: confirmConvert,
        mobileSlot: 'right',
        type: 'primary',
      },
      {
        label: 'Convert As-Is',
        onClick: convertAsIs,
        type: 'secondary',
      },
    ],
    [closeDialog, confirmConvert, convertAsIs],
  )

  return (
    <Modal
      title={`Convert to ${name}`}
      close={closeDialog}
      actions={modalActions}
      className={{
        content: 'md:h-full md:max-h-[90%]',
        description: 'flex flex-col !overflow-hidden',
      }}
    >
      {format === 'txt' || format === 'md' ? (
        <div className="flex items-start border-b border-border p-4 text-sm">
          <Icon type="warning" className="mr-2 flex-shrink-0" />
          Conversion from Super's format to Markdown/Plaintext can be lossy. Please review the converted note before
          saving.
        </div>
      ) : null}
      {componentViewer ? (
        <div className="component-view min-h-0">
          <ComponentView key={componentViewer.identifier} componentViewer={componentViewer} application={application} />
        </div>
      ) : (
        <div className="h-full min-h-0 overflow-hidden">
          <textarea
            readOnly={true}
            className="font-editor h-full w-full resize-none border-0 bg-default p-4 text-editor text-text"
            value={convertedContent}
          />
        </div>
      )}
    </Modal>
  )
}

export default SuperNoteConverter
