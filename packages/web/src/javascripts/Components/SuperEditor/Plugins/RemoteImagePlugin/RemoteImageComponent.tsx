import { useApplication } from '@/Components/ApplicationProvider'
import Icon from '@/Components/Icon/Icon'
import Spinner from '@/Components/Spinner/Spinner'
import { isDesktopApplication } from '@/Utils'
import { BlockWithAlignableContents } from '@lexical/react/LexicalBlockWithAlignableContents'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { classNames, Platform, PrefKey } from '@standardnotes/snjs'
import { $getNodeByKey, CLICK_COMMAND, COMMAND_PRIORITY_LOW, ElementFormatType, NodeKey } from 'lexical'
import { useCallback, useEffect, useRef, useState } from 'react'
import { $createFileNode } from '../EncryptedFilePlugin/Nodes/FileUtils'
import { RemoteImageNode } from './RemoteImageNode'
import { isIOS } from '@standardnotes/ui-services'
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection'
import usePreference from '@/Hooks/usePreference'
import { getCSSValueFromAlignment, ImageAlignmentOptions } from '@/Components/FilePreview/ImageAlignmentOptions'

type Props = {
  src: string
  alt?: string
  node: RemoteImageNode
  className: Readonly<{
    base: string
    focus: string
  }>
  format: ElementFormatType | null
  setFormat: (format: ElementFormatType) => void
  nodeKey: NodeKey
}

const RemoteImageComponent = ({ className, src, alt, node, format, nodeKey, setFormat }: Props) => {
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

  const ref = useRef<HTMLDivElement>(null)
  const [isSelected, setSelected] = useLexicalNodeSelection(nodeKey)

  useEffect(() => {
    return editor.registerCommand<MouseEvent>(
      CLICK_COMMAND,
      (event) => {
        if (ref.current?.contains(event.target as Node)) {
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

  const changeAlignment = useCallback(
    (format: ElementFormatType) => {
      editor.update(() => {
        setFormat(format)
      })
    },
    [editor, setFormat],
  )

  const defaultSuperImageAlignment = usePreference(PrefKey.SuperNoteImageAlignment)
  const finalAlignment = format || defaultSuperImageAlignment
  const alignItems: 'start' | 'center' | 'end' = getCSSValueFromAlignment(finalAlignment)

  return (
    <BlockWithAlignableContents className={className} format={format} nodeKey={nodeKey}>
      <div ref={ref} className="group relative flex min-h-[2rem] flex-col gap-2.5" style={{ alignItems }}>
        <img
          alt={alt}
          src={src}
          onLoad={() => {
            setDidImageLoad(true)
          }}
        />
        <div className="invisible absolute bottom-full left-1/2 z-10 -translate-x-1/2 px-1 pb-1 focus-within:visible group-hover:visible [.embedBlockFocused_&]:visible">
          <div className="flex gap-1 rounded border border-border bg-default px-1 py-0.5">
            <ImageAlignmentOptions alignment={finalAlignment} changeAlignment={changeAlignment} />
          </div>
        </div>
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
