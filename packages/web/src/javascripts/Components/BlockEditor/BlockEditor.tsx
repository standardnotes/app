import { WebApplication } from '@/Application/Application'
import { SNComponent, SNNote } from '@standardnotes/snjs'
import { FunctionComponent, useCallback, useRef } from 'react'
import { BlockEditorController } from './BlockEditorController'
import { AddBlockButton } from './AddButton'
import { MultiBlockRenderer } from './MultiBlockRenderer'

type Props = {
  application: WebApplication
  note: SNNote
}
export const BlockEditor: FunctionComponent<Props> = ({ note, application }) => {
  const controller = useRef(new BlockEditorController(note, application))

  const onEditorSelect = useCallback(
    (component: SNComponent) => {
      void controller.current.addNewBlock(component)
    },
    [controller],
  )

  return (
    <div className="w-full">
      <AddBlockButton application={application} onSelectEditor={onEditorSelect} />
      {note.blocksItem && (
        <MultiBlockRenderer
          controller={controller.current}
          key={note.uuid}
          blocksItem={note.blocksItem}
          note={note}
          application={application}
        />
      )}
    </div>
  )
}
