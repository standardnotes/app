import { createHeadlessEditor } from '@lexical/headless'
import { FileItem, PrefKey, PrefValue, SuperConverterServiceInterface } from '@standardnotes/snjs'
import {
  $createParagraphNode,
  $getRoot,
  $insertNodes,
  $isParagraphNode,
  LexicalEditor,
  LexicalNode,
  SerializedLexicalNode,
} from 'lexical'
import BlocksEditorTheme from '../Lexical/Theme/Theme'
import { BlockEditorNodes, SuperExportNodes } from '../Lexical/Nodes/AllNodes'
import { MarkdownTransformers } from '../MarkdownTransformers'
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html'
import { $createFileExportNode } from '../Lexical/Nodes/FileExportNode'
import { $createInlineFileNode } from '../Plugins/InlineFilePlugin/InlineFileNode'
import { $convertFromMarkdownString } from '@lexical/markdown'
import { $convertToMarkdownString } from '../Lexical/Utils/MarkdownExport'
import { parseFileName } from '@standardnotes/utils'
import { $dfs } from '@lexical/utils'
import { $isFileNode } from '../Plugins/EncryptedFilePlugin/Nodes/FileUtils'
import { $generateNodesFromSerializedNodes, $insertGeneratedNodes } from '@lexical/clipboard'

export class HeadlessSuperConverter implements SuperConverterServiceInterface {
  private importEditor: LexicalEditor
  private exportEditor: LexicalEditor

  constructor() {
    this.importEditor = createHeadlessEditor({
      namespace: 'BlocksEditor',
      theme: BlocksEditorTheme,
      editable: false,
      onError: (error: Error) => console.error(error),
      nodes: BlockEditorNodes,
    })
    this.exportEditor = createHeadlessEditor({
      namespace: 'BlocksEditor',
      theme: BlocksEditorTheme,
      editable: false,
      onError: (error: Error) => console.error(error),
      nodes: SuperExportNodes,
    })
  }

  isValidSuperString(superString: string): boolean {
    try {
      this.importEditor.parseEditorState(superString)
      return true
    } catch (error) {
      return false
    }
  }

  async convertSuperStringToOtherFormat(
    superString: string,
    toFormat: 'txt' | 'md' | 'html' | 'json' | 'pdf',
    config?: {
      embedBehavior?: PrefValue[PrefKey.SuperNoteExportEmbedBehavior]
      getFileItem?: (id: string) => FileItem | undefined
      getFileBase64?: (id: string) => Promise<string | undefined>
      pdf?: {
        pageSize?: PrefValue[PrefKey.SuperNoteExportPDFPageSize]
      }
    },
  ): Promise<string> {
    if (superString.length === 0) {
      return superString
    }

    const { embedBehavior, getFileItem, getFileBase64 } = config ?? { embedBehavior: 'reference' }

    if (embedBehavior === 'separate' && !getFileItem) {
      throw new Error('getFileItem must be provided when embedBehavior is "separate"')
    }
    if (embedBehavior === 'inline' && !getFileItem && !getFileBase64) {
      throw new Error('getFileItem and getFileBase64 must be provided when embedBehavior is "inline"')
    }

    this.exportEditor.setEditorState(this.exportEditor.parseEditorState(superString))

    let content: string | undefined

    await new Promise<void>((resolve) => {
      const handleFileNodes = () => {
        if (embedBehavior === 'reference') {
          resolve()
          return
        }
        if (!getFileItem) {
          resolve()
          return
        }
        const filenameCounts: Record<string, number> = {}
        Promise.all(
          $dfs().map(async ({ node: fileNode }) => {
            if (!$isFileNode(fileNode)) {
              return
            }
            const fileItem = getFileItem(fileNode.getId())
            if (!fileItem) {
              return
            }
            const canInlineFileType = toFormat === 'pdf' ? fileItem.mimeType.startsWith('image/') : true
            if (embedBehavior === 'inline' && getFileBase64 && canInlineFileType) {
              const fileBase64 = await getFileBase64(fileNode.getId())
              if (!fileBase64) {
                return
              }
              this.exportEditor.update(
                () => {
                  const inlineFileNode = $createInlineFileNode(fileBase64, fileItem.mimeType, fileItem.name)
                  fileNode.replace(inlineFileNode)
                },
                { discrete: true },
              )
            } else {
              this.exportEditor.update(
                () => {
                  filenameCounts[fileItem.name] =
                    filenameCounts[fileItem.name] == undefined ? 0 : filenameCounts[fileItem.name] + 1

                  let name = fileItem.name

                  if (filenameCounts[name] > 0) {
                    const { name: _name, ext } = parseFileName(name)
                    name = `${_name}-${fileItem.uuid}.${ext}`
                  }

                  const fileExportNode = $createFileExportNode(name, fileItem.mimeType)
                  fileNode.replace(fileExportNode)
                },
                { discrete: true },
              )
            }
          }),
        )
          .then(() => resolve())
          .catch(console.error)
      }
      this.exportEditor.update(handleFileNodes, { discrete: true })
    })

    await new Promise<void>((resolve) => {
      const convertToFormat = () => {
        switch (toFormat) {
          case 'txt':
          case 'md': {
            for (const { node: paragraph } of $dfs()) {
              if (!$isParagraphNode(paragraph)) {
                continue
              }
              if (paragraph.isEmpty()) {
                paragraph.remove()
              }
            }
            content = $convertToMarkdownString(MarkdownTransformers)
            resolve()
            break
          }
          case 'html':
            content = $generateHtmlFromNodes(this.exportEditor)
            resolve()
            break
          case 'pdf': {
            void import('../Lexical/Utils/PDFExport/PDFExport').then(({ $generatePDFFromNodes }): void => {
              void $generatePDFFromNodes(this.exportEditor, config?.pdf?.pageSize || 'A4').then((pdf) => {
                content = pdf
                resolve()
              })
            })
            break
          }
          case 'json':
          default:
            content = superString
            resolve()
            break
        }
      }
      this.exportEditor.update(convertToFormat, { discrete: true })
    })

    if (typeof content !== 'string') {
      throw new Error('Could not export note')
    }

    return content
  }

  convertOtherFormatToSuperString: SuperConverterServiceInterface['convertOtherFormatToSuperString'] = (
    otherFormatString,
    fromFormat,
    options,
  ) => {
    if (otherFormatString.length === 0) {
      return otherFormatString
    }

    if (fromFormat === 'json' && this.isValidSuperString(otherFormatString)) {
      return otherFormatString
    }

    this.importEditor.update(
      () => {
        $getRoot().clear()
      },
      {
        discrete: true,
      },
    )

    let didThrow = false
    if (fromFormat === 'html') {
      const htmlOptions = options?.html || {
        addLineBreaks: true,
      }

      this.importEditor.update(
        () => {
          try {
            const parser = new DOMParser()
            const dom = parser.parseFromString(otherFormatString, 'text/html')
            const generatedNodes = $generateNodesFromDOM(this.importEditor, dom)
            const nodesToInsert: LexicalNode[] = []
            generatedNodes.forEach((node) => {
              const type = node.getType()

              // Wrap text & link nodes with paragraph since they can't
              // be top-level nodes in Super
              if (
                type === 'text' ||
                type === 'link' ||
                type === 'linebreak' ||
                type === 'unencrypted-image' ||
                type === 'inline-file' ||
                type === 'snfile'
              ) {
                const paragraphNode = $createParagraphNode()
                paragraphNode.append(node)
                nodesToInsert.push(paragraphNode)
                return
              } else {
                nodesToInsert.push(node)
              }

              if (htmlOptions.addLineBreaks) {
                nodesToInsert.push($createParagraphNode())
              }
            })
            $getRoot().selectEnd()
            $insertNodes(nodesToInsert.concat($createParagraphNode()))
          } catch (error) {
            console.error(error)
            didThrow = true
          }
        },
        { discrete: true },
      )
    } else {
      this.importEditor.update(
        () => {
          try {
            $convertFromMarkdownString(otherFormatString, MarkdownTransformers, undefined, true)
          } catch (error) {
            console.error(error)
            didThrow = true
          }
        },
        {
          discrete: true,
        },
      )
    }

    if (didThrow) {
      throw new Error('Could not import note. Check error console for details.')
    }

    return JSON.stringify(this.importEditor.getEditorState())
  }

  getEmbeddedFileIDsFromSuperString(superString: string): string[] {
    if (superString.length === 0) {
      return []
    }

    this.exportEditor.setEditorState(this.exportEditor.parseEditorState(superString))

    const ids: string[] = []

    this.exportEditor.getEditorState().read(() => {
      for (const { node: fileNode } of $dfs()) {
        if (!$isFileNode(fileNode)) {
          continue
        }
        const nodeId = fileNode.getId()
        if (ids.includes(nodeId)) {
          continue
        }
        ids.push(nodeId)
      }
    })

    return ids
  }

  /**
   * Serialized nodes (usually generated by `$generateJSONFromSelectedNodes`) cannot be imported into
   * Lexical if they were directly stringified. This function handles the process of generating actual
   * Lexical nodes from the serialized ones, inserting them into an empty editor and then exporting the
   * editor state of that as a JSON, which can then be used to create a new note.
   */
  getStringifiedJSONFromSerializedNodes(serializedNodes: SerializedLexicalNode[]) {
    this.exportEditor.update(
      () => {
        const root = $getRoot()
        root.clear()
        const selection = root.selectEnd()
        const generatedNodes = $generateNodesFromSerializedNodes(serializedNodes)
        $insertGeneratedNodes(this.exportEditor, generatedNodes, selection)
      },
      {
        discrete: true,
      },
    )
    return this.exportEditor.read(() => {
      return JSON.stringify(this.exportEditor.getEditorState().toJSON())
    })
  }
}
