import { BlockWithAlignableContents } from '@lexical/react/LexicalBlockWithAlignableContents'
import { useMemo } from 'react'
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
  console.log('FileComponent > application', application)
  const file = useMemo(() => application.items.findItem<FileItem>(fileUuid), [application, fileUuid])

  if (!file) {
    return <div>Unable to find file {fileUuid}</div>
  }

  return (
    <BlockWithAlignableContents className={className} format={format} nodeKey={nodeKey}>
      <FilePreview file={file} application={application} />
    </BlockWithAlignableContents>
  )
}
