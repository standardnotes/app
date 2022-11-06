import { WebApplication } from '@/Application/Application'
import { BlockType, NoteBlock, SNNote, BlockValues } from '@standardnotes/snjs'
import { FunctionComponent, useCallback, useMemo, useState } from 'react'
import { MaxBlockHeight } from './MaxBlockHeight'
import { BlockEditorController } from '../BlockEditorController'
import { classNames } from '@/Utils/ConcatenateClassNames'
import Icon from '@/Components/Icon/Icon'
import { ComponentBlock } from '../Blocks/ComponentBlock'
import { PlaintextBlock } from '../Blocks/PlaintextBlock'
import { BlockquoteBlock } from '../Blocks/BlockquoteBlock'

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

  const onHoverEnter = useCallback(() => {
    setShowCloseButton(true)
  }, [])

  const onHoverExit = useCallback(() => {
    setShowCloseButton(false)
  }, [])

  const onRemoveBlock = useCallback(() => {
    void controller.removeBlock(block)
  }, [block, controller])

  const onSizeChange = useCallback(
    (size: { width: number; height: number }) => {
      const adjustedHeight = Math.min(size.height, MaxBlockHeight[block.componentIdentifier || ''] ?? size.height)
      setHeight(adjustedHeight)
      void controller.saveBlockSize(block, { width: size.width, height: adjustedHeight })
    },
    [controller, block],
  )

  const onContentChange = useCallback(
    (values: BlockValues) => {
      void controller.changeBlock(block, values)
    },
    [controller, block],
  )

  const onFocus = useCallback(() => {
    /** Pending implementation */
  }, [])

  const onBlur = useCallback(() => {
    /** Pending implementation */
  }, [])

  const blockComponent = useMemo(() => {
    if (block.type === BlockType.Plaintext) {
      return (
        <PlaintextBlock
          block={block}
          note={note}
          application={application}
          onSizeChange={onSizeChange}
          onChange={onContentChange}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      )
    } else if (block.type === BlockType.Quote) {
      return (
        <BlockquoteBlock
          block={block}
          note={note}
          application={application}
          onSizeChange={onSizeChange}
          onChange={onContentChange}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      )
    } else {
      return <ComponentBlock block={block} note={note} application={application} onSizeChange={onSizeChange} />
    }
  }, [application, block, note, onBlur, onContentChange, onFocus, onSizeChange])

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

      {blockComponent}
    </div>
  )
}
