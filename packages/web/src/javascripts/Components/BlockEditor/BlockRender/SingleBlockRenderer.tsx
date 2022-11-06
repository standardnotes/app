import { WebApplication } from '@/Application/Application'
import { log, LoggingDomain } from '@/Logging'
import { ComponentAction, NoteBlock, SNNote } from '@standardnotes/snjs'
import { FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react'
import ComponentView from '../../ComponentView/ComponentView'
import { MaxBlockHeight } from './MaxBlockHeight'
import { BlockEditorController } from '../BlockEditorController'
import { classNames } from '@/Utils/ConcatenateClassNames'
import Icon from '@/Components/Icon/Icon'

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
  const [showCloseButton, setShowCloseButton] = useState(false)

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

  const onHoverEnter = useCallback(() => {
    setShowCloseButton(true)
  }, [])

  const onHoverExit = useCallback(() => {
    setShowCloseButton(false)
  }, [])

  const onRemoveBlock = useCallback(() => {
    void controller.removeBlock(block)
  }, [block, controller])

  if (!component || !viewer) {
    return <div>Unable to find component {block.editorIdentifier}</div>
  }

  const styles: Record<string, unknown> = {}
  if (height) {
    styles['height'] = height
  }

  return (
    <div
      onMouseEnter={onHoverEnter}
      onMouseLeave={onHoverExit}
      className="w-full border-info hover:border-[1px]"
      style={styles}
    >
      {showCloseButton && (
        <button
          className={classNames(
            'fixed bottom-6 right-6 z-editor-title-bar ml-3 flex h-15 w-15 cursor-pointer items-center',
            `justify-center rounded-full border border-solid border-transparent ${'bg-info text-info-contrast'}`,
            'hover:brightness-125 md:static md:h-8 md:w-8',
          )}
          onClick={onRemoveBlock}
        >
          <Icon type="close" size="custom" className="h-8 w-8 md:h-5 md:w-5" />
        </button>
      )}
      <ComponentView key={viewer.identifier} componentViewer={viewer} application={application} />
    </div>
  )
}
