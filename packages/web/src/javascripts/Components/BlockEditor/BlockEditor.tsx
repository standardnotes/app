import { WebApplication } from '@/Application/Application'
import { ComponentArea, NoteBlock, NoteBlocks, NoteMutator, SNComponent, SNNote } from '@standardnotes/snjs'
import { FunctionComponent, useCallback, useEffect, useMemo, useRef } from 'react'
import ComponentView from '../ComponentView/ComponentView'

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
    <div className="mt-2 flex flex-row">
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
}

const SingleBlockRenderer: FunctionComponent<SingleBlockRendererProps> = ({ block, application, note }) => {
  const component = application.componentManager.componentWithIdentifier(block.editorIdentifier)
  if (!component) {
    return <div>Unable to find component {block.editorIdentifier}</div>
  }

  const viewer = useMemo(
    () => application.componentManager.createBlockComponentViewer(component, note.uuid, block.id),
    [application, component, note.uuid, block.id],
  )

  useEffect(() => {
    return () => {
      if (viewer) {
        application.componentManager.destroyComponentViewer(viewer)
      }
    }
  }, [application, viewer])

  return (
    <div className="w-full">
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
}

export const MultiBlockRenderer: FunctionComponent<MultiBlockRendererProps> = ({ blocksItem, note, application }) => {
  return (
    <div className="w-full">
      {blocksItem.blocks.map((block) => {
        console.log('{blocksItem.blocks.map > block', block)
        return <SingleBlockRenderer key={block.id} block={block} note={note} application={application} />
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
        <MultiBlockRenderer key={note.uuid} blocksItem={note.blocksItem} note={note} application={application} />
      )}
    </div>
  )
}
