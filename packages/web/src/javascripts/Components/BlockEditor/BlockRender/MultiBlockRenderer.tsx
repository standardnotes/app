import { WebApplication } from '@/Application/Application'
import { NoteBlocks, SNNote } from '@standardnotes/snjs'
import { FunctionComponent } from 'react'
import { BlockEditorController } from '../BlockEditorController'
import { SingleBlockRenderer } from './SingleBlockRenderer'

type MultiBlockRendererProps = {
  application: WebApplication
  note: SNNote
  blocksItem: NoteBlocks
  controller: BlockEditorController
}

export const MultiBlockRenderer: FunctionComponent<MultiBlockRendererProps> = ({
  blocksItem,
  controller,
  note,
  application,
}) => {
  return (
    <div className="w-full">
      {blocksItem.blocks.map((block) => {
        return (
          <SingleBlockRenderer
            key={block.id}
            block={block}
            note={note}
            application={application}
            controller={controller}
          />
        )
      })}
    </div>
  )
}
