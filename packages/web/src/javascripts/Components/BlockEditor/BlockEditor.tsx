import { WebApplication } from '@/Application/Application'
import { log, LoggingDomain } from '@/Logging'
import {
  ComponentAction,
  ComponentArea,
  NoteBlock,
  NoteBlocks,
  NoteMutator,
  SNComponent,
  SNNote,
} from '@standardnotes/snjs'
import { FunctionComponent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ComponentView from '../ComponentView/ComponentView'

const MaxBlockHeight: Record<string, number> = {
  'org.standardnotes.standard-sheets': 300,
}

export class BlockEditorController {
  constructor(private note: SNNote, private application: WebApplication) {
    this.note = note
    this.application = application
  }

  deinit() {
    ;(this.note as unknown) = undefined
    ;(this.application as unknown) = undefined
  }

  createBlockItem(editor: SNComponent): NoteBlock {
    const id = this.application.generateUuid()
    const block: NoteBlock = {
      id: id,
      editorIdentifier: editor.identifier,
      type: editor.noteType,
      content: '',
    }

    return block
  }

  async addNewBlock(editor: SNComponent): Promise<void> {
    const block = this.createBlockItem(editor)
    await this.application.mutator.changeAndSaveItem<NoteMutator>(this.note, (mutator) => {
      mutator.addBlock(block)
    })
  }

  async saveBlockSize(block: NoteBlock, size: { width: number; height: number }): Promise<void> {
    if (block.size?.height === size.height) {
      return
    }

    await this.application.mutator.changeAndSaveItem<NoteMutator>(this.note, (mutator) => {
      mutator.changeBlockSize(block.id, size)
    })
  }
}

/**
 *
 */

type AddButtonProps = {
  application: WebApplication
  onSelectEditor: (editor: SNComponent) => void
}

const AddBlockButton: FunctionComponent<AddButtonProps> = ({ application, onSelectEditor }) => {
  const components = application.componentManager.componentsForArea(ComponentArea.Editor)

  return (
    <div className="mt-2 flex flex-row flex-wrap">
      {components.map((component) => {
        return (
          <div className="m-3 border-2" key={component.uuid} onClick={() => onSelectEditor(component)}>
            {component.name}
          </div>
        )
      })}
    </div>
  )
}

/**
 *
 */

type SingleBlockRendererProps = {
  application: WebApplication
  block: NoteBlock
  note: SNNote
  controller: BlockEditorController
}

const SingleBlockRenderer: FunctionComponent<SingleBlockRendererProps> = ({ block, application, note, controller }) => {
  const [height, setHeight] = useState<number | undefined>(block.size?.height)

  const component = useMemo(
    () => application.componentManager.componentWithIdentifier(block.editorIdentifier),
    [block, application],
  )

  const viewer = useMemo(
    () => component && application.componentManager.createBlockComponentViewer(component, note.uuid, block.id),
    [application, component, note.uuid, block.id],
  )

  useEffect(() => {
    const disposer = viewer?.addActionObserver((action, data) => {
      if (action === ComponentAction.SetSize) {
        if (data.height && data.height > 0) {
          const height = Math.min(Number(data.height), MaxBlockHeight[block.editorIdentifier] ?? Number(data.height))
          log(LoggingDomain.BlockEditor, `Received block height ${height}`)
          setHeight(height)
          controller.saveBlockSize(block, { width: 0, height })
        }
      }
    })

    return disposer
  }, [viewer])

  useEffect(() => {
    return () => {
      if (viewer) {
        application.componentManager.destroyComponentViewer(viewer)
      }
    }
  }, [application, viewer])

  if (!component || !viewer) {
    return <div>Unable to find component {block.editorIdentifier}</div>
  }

  const styles: Record<string, unknown> = {}
  if (height) {
    styles['height'] = height
  }

  return (
    <div className="w-full" style={styles}>
      <ComponentView key={viewer.identifier} componentViewer={viewer} application={application} />
    </div>
  )
}

/**
 *
 */

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

/**
 *
 */

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
