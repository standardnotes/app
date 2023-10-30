import { createHeadlessEditor } from '@lexical/headless'
import { $convertToMarkdownString, $convertFromMarkdownString } from '@lexical/markdown'
import { FileItem, PrefKey, PrefValue, SuperConverterServiceInterface } from '@standardnotes/snjs'
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
import { SuperExportNodes } from '../Lexical/Nodes/AllNodes'
import { MarkdownTransformers } from '../MarkdownTransformers'
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html'
import { FileNode } from '../Plugins/EncryptedFilePlugin/Nodes/FileNode'
import { $createFileExportNode } from '../Lexical/Nodes/FileExportNode'
export class HeadlessSuperConverter implements SuperConverterServiceInterface {
  private editor: LexicalEditor

  constructor() {
    this.editor = createHeadlessEditor({
      namespace: 'BlocksEditor',
      theme: BlocksEditorTheme,
      editable: false,
      onError: (error: Error) => console.error(error),
      nodes: SuperExportNodes,
    })
  }

  isValidSuperString(superString: string): boolean {
    try {
      this.editor.parseEditorState(superString)
      return true
    } catch (error) {
      return false
    }
  }

  convertSuperStringToOtherFormat(
    superString: string,
    toFormat: 'txt' | 'md' | 'html' | 'json',
    config?: {
      embedBehavior?: PrefValue[PrefKey.SuperNoteExportEmbedBehavior]
      getFileItem?: (id: string) => FileItem | undefined
    },
  ): string {
    if (superString.length === 0) {
      return superString
    }

    const { embedBehavior, getFileItem } = config ?? { embedBehavior: 'reference' }

    if (embedBehavior === 'separate' && !getFileItem) {
      throw new Error('getFileItem must be provided when embedBehavior is "separate"')
    }

    this.editor.setEditorState(this.editor.parseEditorState(superString))

    let content: string | undefined

    this.editor.update(
      () => {
        if (embedBehavior === 'separate' && getFileItem) {
          const fileNodes = $nodesOfType(FileNode)
          fileNodes.forEach((fileNode) => {
            const fileItem = getFileItem(fileNode.getId())
            if (!fileItem) {
              return
            }
            const fileExportNode = $createFileExportNode(fileItem.name, fileItem.mimeType)
            fileNode.replace(fileExportNode)
          })
        }
      },
      { discrete: true },
    )

    this.editor.update(
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
            content = $generateHtmlFromNodes(this.editor)
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

    this.editor.update(
      () => {
        $getRoot().clear()
      },
      {
        discrete: true,
      },
    )

    let didThrow = false
    if (fromFormat === 'html') {
      this.editor.update(
        () => {
          try {
            const parser = new DOMParser()
            const dom = parser.parseFromString(otherFormatString, 'text/html')
            const generatedNodes = $generateNodesFromDOM(this.editor, dom)
            const nodesToInsert: LexicalNode[] = []
            generatedNodes.forEach((node) => {
              const type = node.getType()

              // Wrap text & link nodes with paragraph since they can't
              // be top-level nodes in Super
              if (
                type === 'text' ||
                type === 'link' ||
                type === 'unencrypted-image' ||
                type === 'inline-file' ||
                node.isParentRequired()
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
      this.editor.update(
        () => {
          try {
            $convertFromMarkdownString(otherFormatString, MarkdownTransformers)
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
      throw new Error('Could not import note')
    }

    return JSON.stringify(this.editor.getEditorState())
  }

  getEmbeddedFileIDsFromSuperString(superString: string): string[] {
    if (superString.length === 0) {
      return []
    }

    this.editor.setEditorState(this.editor.parseEditorState(superString))

    const ids: string[] = []

    this.editor.getEditorState().read(() => {
      const fileNodes = $nodesOfType(FileNode)
      fileNodes.forEach((fileNode) => {
        ids.push(fileNode.getId())
      })
    })

    return ids
  }
}
