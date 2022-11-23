import { BlockWithAlignableContents } from '@lexical/react/LexicalBlockWithAlignableContents'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ElementFormatType, NodeKey } from 'lexical'
import { useApplication } from '@/Components/ApplicationView/ApplicationProvider'
import FilePreview from '@/Components/FilePreview/FilePreview'
import { FileItem } from '@standardnotes/snjs'

export type FileComponentProps = Readonly<{
  className: Readonly<{
    base: string
    focus: string
  }>
  format: ElementFormatType | null
  nodeKey: NodeKey
  fileUuid: string
}>

export function FileComponent({ className, format, nodeKey, fileUuid }: FileComponentProps) {
  const application = useApplication()
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

  if (!file) {
    return <div>Unable to find file {fileUuid}</div>
  }

  return (
    <BlockWithAlignableContents className={className} format={format} nodeKey={nodeKey}>
      <div ref={blockWrapperRef}>
        {canLoad && <FilePreview isEmbedded={true} file={file} application={application} />}
      </div>
    </BlockWithAlignableContents>
  )
}
