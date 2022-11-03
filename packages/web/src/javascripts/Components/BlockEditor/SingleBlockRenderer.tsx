import { WebApplication } from '@/Application/Application'
import { log, LoggingDomain } from '@/Logging'
import { ComponentAction, NoteBlock, SNNote } from '@standardnotes/snjs'
import { FunctionComponent, useEffect, useMemo, useState } from 'react'
import ComponentView from '../ComponentView/ComponentView'
import { MaxBlockHeight } from './MaxBlockHeight'
import { BlockEditorController } from './BlockEditorController'

type SingleBlockRendererProps = {
  application: WebApplication
  block: NoteBlock
  note: SNNote
  controller: BlockEditorController
}

export const SingleBlockRenderer: FunctionComponent<SingleBlockRendererProps> = ({
  block,
  application,
  note,
  controller,
}) => {
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
          void controller.saveBlockSize(block, { width: 0, height })
        }
      }
    })

    return disposer
  }, [viewer, block, controller])

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
