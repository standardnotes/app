import { WebApplication } from '@/Application/Application'
import { SNNote } from '@standardnotes/snjs'
import { FunctionComponent, useCallback, useRef } from 'react'
import { BlockEditorController } from './BlockEditorController'
import { AddBlockButton } from './AddButton'
import { MultiBlockRenderer } from './BlockRender/MultiBlockRenderer'
import { BlockOption } from './BlockMenu/BlockOption'

type Props = {
  application: WebApplication
  note: SNNote
}
export const BlockEditor: FunctionComponent<Props> = ({ note, application }) => {
  const controller = useRef(new BlockEditorController(note, application))

  const onSelectOption = useCallback(
    (option: BlockOption) => {
      void controller.current.addNewBlock(option)
    },
    [controller],
  )

  return (
    <div className="w-full">
      <AddBlockButton application={application} onSelectOption={onSelectOption} />
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
