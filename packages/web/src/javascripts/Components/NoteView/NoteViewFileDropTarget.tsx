import { LinkingController } from '@/Controllers/LinkingController'
import { SNNote } from '@standardnotes/snjs'
import { useEffect } from 'react'
import { useFileDragNDrop } from '../FileDragNDropProvider/FileDragNDropProvider'

type Props = {
  note: SNNote
  linkingController: LinkingController
  noteViewElement: HTMLElement | null
}

const NoteViewFileDropTarget = ({ note, linkingController, noteViewElement }: Props) => {
  const { addDragTarget, removeDragTarget } = useFileDragNDrop()

  useEffect(() => {
    const target = noteViewElement

    if (target) {
      addDragTarget(target, {
        tooltipText: 'Drop your files to upload and link them to the current note',
        callback(files) {
          files.forEach(async (uploadedFile) => {
            await linkingController.linkItems(uploadedFile, note)
          })
        },
      })
    }

    return () => {
      if (target) {
        removeDragTarget(target)
      }
    }
  }, [addDragTarget, linkingController, note, noteViewElement, removeDragTarget])

  return null
}

export default NoteViewFileDropTarget
