import { useApplication } from '@/Components/ApplicationView/ApplicationProvider'
import { downloadBlobOnAndroid } from '@/NativeMobileWeb/DownloadBlobOnAndroid'
import { shareBlobOnMobile } from '@/NativeMobileWeb/ShareBlobOnMobile'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { Platform, WebAppEvent } from '@standardnotes/snjs'
import { sanitizeFileName } from '@standardnotes/ui-services'
import { useCallback, useEffect } from 'react'
import { $convertToMarkdownString } from '@lexical/markdown'
import { MarkdownTransformers } from '@standardnotes/blocks-editor'
import { $generateHtmlFromNodes } from '@lexical/html'

export const ExportPlugin = () => {
  const application = useApplication()
  const [editor] = useLexicalComposerContext()

  const downloadData = useCallback(
    (data: Blob, fileName: string) => {
      if (!application.isNativeMobileWeb()) {
        application.getArchiveService().downloadData(data, fileName)
        return
      }

      if (application.platform === Platform.Android) {
        downloadBlobOnAndroid(application, data, fileName).catch(console.error)
      } else {
        shareBlobOnMobile(application, data, fileName).catch(console.error)
      }
    },
    [application],
  )

  const exportJson = useCallback(
    (title: string) => {
      const content = JSON.stringify(editor.toJSON())
      const blob = new Blob([content], { type: 'application/json' })
      downloadData(blob, `${sanitizeFileName(title)}.json`)
    },
    [downloadData, editor],
  )

  const exportMarkdown = useCallback(
    (title: string) => {
      editor.getEditorState().read(() => {
        const content = $convertToMarkdownString(MarkdownTransformers)
        const blob = new Blob([content], { type: 'text/markdown' })
        downloadData(blob, `${sanitizeFileName(title)}.md`)
      })
    },
    [downloadData, editor],
  )

  const exportHtml = useCallback(
    (title: string) => {
      editor.getEditorState().read(() => {
        const content = $generateHtmlFromNodes(editor)
        const blob = new Blob([content], { type: 'text/html' })
        downloadData(blob, `${sanitizeFileName(title)}.html`)
      })
    },
    [downloadData, editor],
  )

  useEffect(() => {
    return application.addWebEventObserver((event, data) => {
      if (event === WebAppEvent.SuperNoteExportJson) {
        const title = data as string
        exportJson(title)
      } else if (event === WebAppEvent.SuperNoteExportMarkdown) {
        const title = data as string
        exportMarkdown(title)
      } else if (event === WebAppEvent.SuperNoteExportHtml) {
        const title = data as string
        exportHtml(title)
      }
    })
  }, [application, exportHtml, exportJson, exportMarkdown])

  return null
}
