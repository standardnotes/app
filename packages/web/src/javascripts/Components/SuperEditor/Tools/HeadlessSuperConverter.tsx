import { createHeadlessEditor } from '@lexical/headless'
import { $convertToMarkdownString } from '@lexical/markdown'
import { FileItem, GenerateUuid, PrefKey, PrefValue, SuperConverterServiceInterface } from '@standardnotes/snjs'
import {
  $createParagraphNode,
  $getRoot,
  $insertNodes,
  $nodesOfType,
  LexicalEditor,
  LexicalNode,
  ParagraphNode,
} from 'lexical'
import BlocksEditorTheme from '../Lexical/Theme/Theme'
import { BlockEditorNodes, SuperExportNodes } from '../Lexical/Nodes/AllNodes'
import { MarkdownTransformers } from '../MarkdownTransformers'
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html'
import { FileNode } from '../Plugins/EncryptedFilePlugin/Nodes/FileNode'
import { $createFileExportNode } from '../Lexical/Nodes/FileExportNode'
import { $createInlineFileNode, $isInlineFileNode, InlineFileNode } from '../Plugins/InlineFilePlugin/InlineFileNode'
import { $createFileNode } from '../Plugins/EncryptedFilePlugin/Nodes/FileUtils'
import { RemoteImageNode } from '../Plugins/RemoteImagePlugin/RemoteImageNode'
import { $convertFromMarkdownString } from '../Lexical/Utils/MarkdownImport'
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
    toFormat: 'txt' | 'md' | 'html' | 'json',
    config?: {
      embedBehavior?: PrefValue[PrefKey.SuperNoteExportEmbedBehavior]
      getFileItem?: (id: string) => FileItem | undefined
      getFileBase64?: (id: string) => Promise<string | undefined>
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
      this.exportEditor.update(
        () => {
          if (embedBehavior === 'reference') {
            resolve()
            return
          }
          if (!getFileItem) {
            resolve()
            return
          }
          const fileNodes = $nodesOfType(FileNode)
          Promise.all(
            fileNodes.map(async (fileNode) => {
              const fileItem = getFileItem(fileNode.getId())
              if (!fileItem) {
                return
              }
              if (embedBehavior === 'inline' && getFileBase64) {
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
                    const fileExportNode = $createFileExportNode(fileItem.name, fileItem.mimeType)
                    fileNode.replace(fileExportNode)
                  },
                  { discrete: true },
                )
              }
            }),
          )
            .then(() => resolve())
            .catch(console.error)
        },
        { discrete: true },
      )
    })

    this.exportEditor.update(
      () => {
        switch (toFormat) {
          case 'txt':
          case 'md': {
            const paragraphs = $nodesOfType(ParagraphNode)
            for (const paragraph of paragraphs) {
              if (paragraph.isEmpty()) {
                paragraph.remove()
              }
            }
            content = $convertToMarkdownString(MarkdownTransformers)
            break
          }
          case 'html':
            content = $generateHtmlFromNodes(this.exportEditor)
            break
          case 'json':
          default:
            content = superString
            break
        }
      },
      { discrete: true },
    )

    if (typeof content !== 'string') {
      throw new Error('Could not export note')
    }

    return content
  }

  convertOtherFormatToSuperString(otherFormatString: string, fromFormat: 'txt' | 'md' | 'html' | 'json'): string {
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

              nodesToInsert.push($createParagraphNode())
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
      const fileNodes = $nodesOfType(FileNode)
      fileNodes.forEach((fileNode) => {
        ids.push(fileNode.getId())
      })
    })

    return ids
  }

  async uploadAndReplaceInlineFilesInSuperString(
    superString: string,
    uploadFile: (file: File) => Promise<FileItem | undefined>,
    linkFile: (file: FileItem) => Promise<void>,
    generateUuid: GenerateUuid,
  ): Promise<string> {
    if (superString.length === 0) {
      return superString
    }

    this.importEditor.setEditorState(this.importEditor.parseEditorState(superString))

    await new Promise<void>((resolve) => {
      this.importEditor.update(
        () => {
          const inlineFileNodes = $nodesOfType(InlineFileNode)
          const remoteImageNodes = $nodesOfType(RemoteImageNode).filter((node) => node.__src.startsWith('data:'))
          const concatenatedNodes = [...inlineFileNodes, ...remoteImageNodes]
          if (concatenatedNodes.length === 0) {
            resolve()
            return
          }
          ;(async () => {
            for (const node of concatenatedNodes) {
              const blob = await fetch(node.__src).then((response) => response.blob())
              const name = $isInlineFileNode(node) ? node.__fileName : node.__alt
              const mimeType = $isInlineFileNode(node) ? node.__mimeType : node.__src.split(';')[0].split(':')[1]
              const file = new File([blob], name || generateUuid.execute().getValue(), {
                type: mimeType,
              })

              const uploadedFile = await uploadFile(file)

              if (!uploadedFile) {
                return
              }

              this.importEditor.update(
                () => {
                  const fileNode = $createFileNode(uploadedFile.uuid)
                  node.replace(fileNode)
                },
                { discrete: true },
              )

              await linkFile(uploadedFile)
            }
          })()
            .then(() => resolve())
            .catch(console.error)
        },
        { discrete: true },
      )
    })

    return JSON.stringify(this.importEditor.getEditorState())
  }
}
