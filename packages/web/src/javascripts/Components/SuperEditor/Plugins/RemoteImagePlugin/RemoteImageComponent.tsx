import { useApplication } from '@/Components/ApplicationProvider'
import Icon from '@/Components/Icon/Icon'
import Spinner from '@/Components/Spinner/Spinner'
import { isDesktopApplication } from '@/Utils'
import { BlockWithAlignableContents } from '@lexical/react/LexicalBlockWithAlignableContents'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { classNames, Platform } from '@standardnotes/snjs'
import { ElementFormatType, NodeKey } from 'lexical'
import { useCallback, useState } from 'react'
import { $createFileNode } from '../EncryptedFilePlugin/Nodes/FileUtils'
import { RemoteImageNode } from './RemoteImageNode'
import { isIOS } from '@standardnotes/ui-services'

type Props = {
  src: string
  alt?: string
  node: RemoteImageNode
  className: Readonly<{
    base: string
    focus: string
  }>
  format: ElementFormatType | null
  nodeKey: NodeKey
}

const RemoteImageComponent = ({ className, src, alt, node, format, nodeKey }: Props) => {
  const application = useApplication()
  const [editor] = useLexicalComposerContext()

  const [didImageLoad, setDidImageLoad] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const fetchAndUploadImage = useCallback(async () => {
    setIsSaving(true)
    try {
      const response = await fetch(src)

      if (!response.ok) {
        return
      }

      const blob = await response.blob()
      const file = new File([blob], src, { type: blob.type })

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
  }, [application, editor, node, src])

  const isBase64OrDataUrl = src.startsWith('data:')
  const canShowSaveButton = application.isNativeMobileWeb() || isDesktopApplication() || isBase64OrDataUrl

  return (
    <BlockWithAlignableContents className={className} format={format} nodeKey={nodeKey}>
      <div className="relative flex min-h-[2rem] flex-col items-center gap-2.5">
        <img
          alt={alt}
          src={src}
          onLoad={() => {
            setDidImageLoad(true)
          }}
        />
        {didImageLoad && canShowSaveButton && (
          <button
            className={classNames(
              'flex items-center gap-2.5 rounded border border-border bg-default px-2.5 py-1.5',
              !isSaving && 'hover:bg-info hover:text-info-contrast',
            )}
            onClick={() => {
              const isIOSPlatform = application.platform === Platform.Ios || isIOS()
              if (isIOSPlatform && document.activeElement) {
                ;(document.activeElement as HTMLElement).blur()
              }
              fetchAndUploadImage().catch(console.error)
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
                Save image to Files
              </>
            )}
          </button>
        )}
      </div>
    </BlockWithAlignableContents>
  )
}

export default RemoteImageComponent
