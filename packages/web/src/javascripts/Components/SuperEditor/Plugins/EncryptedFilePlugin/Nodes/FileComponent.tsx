import { BlockWithAlignableContents } from '@lexical/react/LexicalBlockWithAlignableContents'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { $getNodeByKey, CLICK_COMMAND, COMMAND_PRIORITY_LOW, ElementFormatType, NodeKey } from 'lexical'
import { useApplication } from '@/Components/ApplicationProvider'
import FilePreview from '@/Components/FilePreview/FilePreview'
import { FileItem } from '@standardnotes/snjs'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection'

export type FileComponentProps = Readonly<{
  className: Readonly<{
    base: string
    focus: string
  }>
  format: ElementFormatType | null
  nodeKey: NodeKey
  fileUuid: string
  zoomLevel: number
  setZoomLevel: (zoomLevel: number) => void
}>

export function FileComponent({ className, format, nodeKey, fileUuid, zoomLevel, setZoomLevel }: FileComponentProps) {
  const application = useApplication()
  const [editor] = useLexicalComposerContext()
  const file = useMemo(() => application.items.findItem<FileItem>(fileUuid), [application, fileUuid])

  const [canLoad, setCanLoad] = useState(false)

  const blockWrapperRef = useRef<HTMLDivElement>(null)
  const blockObserver = useMemo(
    () =>
      new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setCanLoad(true)
            }
          })
        },
        {
          threshold: 0.25,
        },
      ),
    [],
  )

  useEffect(() => {
    const wrapper = blockWrapperRef.current

    if (!wrapper) {
      return
    }

    blockObserver.observe(wrapper)

    return () => {
      blockObserver.unobserve(wrapper)
    }
  }, [blockObserver])

  const setImageZoomLevel = useCallback(
    (zoomLevel: number) => {
      editor.update(() => {
        setZoomLevel(zoomLevel)
      })
    },
    [editor, setZoomLevel],
  )

  const [isSelected, setSelected] = useLexicalNodeSelection(nodeKey)

  useEffect(() => {
    return editor.registerCommand<MouseEvent>(
      CLICK_COMMAND,
      (event) => {
        if (blockWrapperRef.current?.contains(event.target as Node)) {
          event.preventDefault()

          $getNodeByKey(nodeKey)?.selectEnd()

          setTimeout(() => {
            setSelected(!isSelected)
          })
          return true
        }

        return false
      },
      COMMAND_PRIORITY_LOW,
    )
  }, [editor, isSelected, nodeKey, setSelected])

  if (!file) {
    return (
      <BlockWithAlignableContents className={className} format={format} nodeKey={nodeKey}>
        <div>Unable to find file {fileUuid}</div>
      </BlockWithAlignableContents>
    )
  }

  return (
    <BlockWithAlignableContents className={className} format={format} nodeKey={nodeKey}>
      <div ref={blockWrapperRef}>
        {canLoad && (
          <FilePreview
            isEmbeddedInSuper={true}
            file={file}
            application={application}
            imageZoomLevel={zoomLevel}
            setImageZoomLevel={setImageZoomLevel}
          />
        )}
      </div>
    </BlockWithAlignableContents>
  )
}
