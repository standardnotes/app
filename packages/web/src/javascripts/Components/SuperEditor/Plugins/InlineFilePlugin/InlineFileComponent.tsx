import { BlockWithAlignableContents } from '@lexical/react/LexicalBlockWithAlignableContents'
import { Platform, classNames } from '@standardnotes/snjs'
import { ElementFormatType, NodeKey } from 'lexical'
import { InlineFileNode } from './InlineFileNode'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useApplication } from '@/Components/ApplicationProvider'
import { useCallback, useState } from 'react'
import { $createFileNode } from '../EncryptedFilePlugin/Nodes/FileUtils'
import { isIOS } from '@standardnotes/ui-services'
import Icon from '@/Components/Icon/Icon'
import Spinner from '@/Components/Spinner/Spinner'

type Props = {
  fileName: string | undefined
  mimeType: string
  src: string
  className: Readonly<{
    base: string
    focus: string
  }>
  format: ElementFormatType | null
  node: InlineFileNode
  nodeKey: NodeKey
}

const InlineFileComponent = ({ className, src, mimeType, fileName, format, node, nodeKey }: Props) => {
  const application = useApplication()
  const [editor] = useLexicalComposerContext()

  const [isSaving, setIsSaving] = useState(false)
  const saveToFilesAndReplaceNode = useCallback(async () => {
    setIsSaving(true)
    try {
      const blob = await fetch(src).then((response) => response.blob())
      const file = new File([blob], fileName || application.generateUUID(), { type: mimeType })

      const { filesController, linkingController } = application

      const uploadedFile = await filesController.uploadNewFile(file, { showToast: false })

      if (!uploadedFile) {
        return
      }

      editor.update(() => {
        const fileNode = $createFileNode(uploadedFile.uuid)
        node.replace(fileNode)
      })

      void linkingController.linkItemToSelectedItem(uploadedFile)
    } catch (error) {
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }, [application, editor, fileName, mimeType, node, src])

  const isPDF = mimeType === 'application/pdf'

  return (
    <BlockWithAlignableContents className={className} format={format} nodeKey={nodeKey}>
      {mimeType.startsWith('image') ? (
        <div className="relative flex min-h-[2rem] flex-col items-center gap-2.5">
          <img alt={fileName} src={src} />
        </div>
      ) : mimeType.startsWith('video') ? (
        <video className="h-full w-full" controls autoPlay>
          <source src={src} type={mimeType} />
        </video>
      ) : mimeType.startsWith('audio') ? (
        <div className="flex h-full w-full items-center justify-center">
          <audio controls>
            <source src={src} type={mimeType} />
          </audio>
        </div>
      ) : (
        <object
          className={classNames('h-full w-full', isPDF && 'min-h-[65vh]')}
          data={isPDF ? src + '#view=FitV' : src}
        />
      )}
      <button
        className={classNames(
          'mx-auto mt-2 flex items-center gap-2.5 rounded border border-border bg-default px-2.5 py-1.5',
          !isSaving && 'hover:bg-info hover:text-info-contrast',
        )}
        onClick={() => {
          const isIOSPlatform = application.platform === Platform.Ios || isIOS()
          if (isIOSPlatform && document.activeElement) {
            ;(document.activeElement as HTMLElement).blur()
          }
          saveToFilesAndReplaceNode().catch(console.error)
        }}
        disabled={isSaving}
      >
        {isSaving ? (
          <>
            <Spinner className="h-4 w-4" />
            Saving...
          </>
        ) : (
          <>
            <Icon type="download" />
            Save to Files
          </>
        )}
      </button>
    </BlockWithAlignableContents>
  )
}

export default InlineFileComponent
