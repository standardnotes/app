import { useApplication } from '@/Components/ApplicationProvider'
import { downloadBlobOnAndroid } from '@/NativeMobileWeb/DownloadBlobOnAndroid'
import { shareBlobOnMobile } from '@/NativeMobileWeb/ShareBlobOnMobile'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { Platform } from '@standardnotes/snjs'
import {
  sanitizeFileName,
  SUPER_EXPORT_HTML,
  SUPER_EXPORT_JSON,
  SUPER_EXPORT_MARKDOWN,
} from '@standardnotes/ui-services'
import { useCallback, useEffect, useRef } from 'react'
import { useCommandService } from '@/Components/CommandProvider'
import { HeadlessSuperConverter } from '../../Tools/HeadlessSuperConverter'

// @ts-expect-error Using inline loaders to load CSS as string
import superEditorCSS from '!css-loader!sass-loader!../../Lexical/Theme/editor.scss'
// @ts-expect-error Using inline loaders to load CSS as string
import snColorsCSS from '!css-loader!sass-loader!@standardnotes/styles/src/Styles/_colors.scss'

const html = (title: string, content: string) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <style>
      ${snColorsCSS.toString()}
      ${superEditorCSS.toString()}
      .Lexical__listItemUnchecked, .Lexical__listItemChecked {
        min-height: 18px;
        margin-bottom: 4px;
      }
      .Lexical__listItemUnchecked:before, .Lexical__listItemChecked:before {
        top: 0px;
      }
      .Lexical__listItemChecked:after {
        top: 1px;
      }
    </style>
  </head>
  <body>
    ${content}
  </body>
</html>
`

export const ExportPlugin = () => {
  const application = useApplication()
  const [editor] = useLexicalComposerContext()
  const commandService = useCommandService()

  const converter = useRef(new HeadlessSuperConverter())

  const downloadData = useCallback(
    (data: Blob, fileName: string) => {
      if (!application.isNativeMobileWeb()) {
        application.archiveService.downloadData(data, fileName)
        return
      }

      if (application.platform === Platform.Android) {
        downloadBlobOnAndroid(application.mobileDevice, data, fileName).catch(console.error)
      } else {
        shareBlobOnMobile(application.mobileDevice, application.isNativeMobileWeb(), data, fileName).catch(
          console.error,
        )
      }
    },
    [application],
  )

  const exportJson = useCallback(
    (title: string) => {
      const content = converter.current.convertSuperStringToOtherFormat(JSON.stringify(editor.getEditorState()), 'json')
      const blob = new Blob([content], { type: 'application/json' })
      downloadData(blob, `${sanitizeFileName(title)}.json`)
    },
    [downloadData, editor],
  )

  const exportMarkdown = useCallback(
    (title: string) => {
      const content = converter.current.convertSuperStringToOtherFormat(JSON.stringify(editor.getEditorState()), 'md')
      const blob = new Blob([content], { type: 'text/markdown' })
      downloadData(blob, `${sanitizeFileName(title)}.md`)
    },
    [downloadData, editor],
  )

  const exportHtml = useCallback(
    (title: string) => {
      const content = html(
        title,
        converter.current.convertSuperStringToOtherFormat(JSON.stringify(editor.getEditorState()), 'html'),
      )
      const blob = new Blob([content], { type: 'text/html' })
      downloadData(blob, `${sanitizeFileName(title)}.html`)
    },
    [downloadData, editor],
  )

  useEffect(() => {
    return commandService.addCommandHandler({
      command: SUPER_EXPORT_JSON,
      onKeyDown: (_, data) => {
        if (!data) {
          throw new Error('No data provided for export command')
        }

        const title = data as string
        exportJson(title)
      },
    })
  }, [commandService, exportJson])

  useEffect(() => {
    return commandService.addCommandHandler({
      command: SUPER_EXPORT_MARKDOWN,
      onKeyDown: (_, data) => {
        if (!data) {
          throw new Error('No data provided for export command')
        }

        const title = data as string
        exportMarkdown(title)
      },
    })
  }, [commandService, exportMarkdown])

  useEffect(() => {
    return commandService.addCommandHandler({
      command: SUPER_EXPORT_HTML,
      onKeyDown: (_, data) => {
        if (!data) {
          throw new Error('No data provided for export command')
        }

        const title = data as string
        exportHtml(title)
      },
    })
  }, [commandService, exportHtml])

  return null
}
