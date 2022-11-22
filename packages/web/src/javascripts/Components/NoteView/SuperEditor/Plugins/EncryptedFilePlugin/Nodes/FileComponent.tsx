import { BlockWithAlignableContents } from '@lexical/react/LexicalBlockWithAlignableContents'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { COMMAND_PRIORITY_EDITOR, ElementFormatType, NodeKey } from 'lexical'
import { useApplication } from '@/Components/ApplicationView/ApplicationProvider'
import FilePreview from '@/Components/FilePreview/FilePreview'
import { FileItem } from '@standardnotes/snjs'
import Button from '@/Components/Button/Button'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { LOAD_ALL_FILES_COMMAND } from '../../Commands'

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

  const [editor] = useLexicalComposerContext()
  const [canLoad, setCanLoad] = useState(false)

  useEffect(() => {
    editor.registerCommand(
      LOAD_ALL_FILES_COMMAND,
      () => {
        setCanLoad(true)
        return false
      },
      COMMAND_PRIORITY_EDITOR,
    )
  }, [editor])

  const loadCurrentFile = useCallback(() => {
    setCanLoad(true)
  }, [])

  const loadAllFiles = useCallback(() => {
    editor.dispatchCommand(LOAD_ALL_FILES_COMMAND, '')
  }, [editor])

  if (!file) {
    return <div>Unable to find file {fileUuid}</div>
  }

  return (
    <BlockWithAlignableContents className={className} format={format} nodeKey={nodeKey}>
      {canLoad ? (
        <FilePreview file={file} application={application} />
      ) : (
        <div className="mb-4 flex h-full flex-grow flex-col items-center justify-center gap-2 border border-border py-6 px-4">
          <h1 className="m-0 text-2xl font-bold">{file.name}</h1>
          <div className="flex gap-3">
            <Button onClick={loadCurrentFile}>Load file</Button>
            <Button onClick={loadAllFiles}>Load all files</Button>
          </div>
        </div>
      )}
    </BlockWithAlignableContents>
  )
}
