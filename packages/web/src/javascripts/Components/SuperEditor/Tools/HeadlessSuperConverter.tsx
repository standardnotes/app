import { createHeadlessEditor } from '@lexical/headless'
import { $convertToMarkdownString, $convertFromMarkdownString } from '@lexical/markdown'
import { SuperConverterServiceInterface } from '@standardnotes/snjs'
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
import { BlockEditorNodes } from '../Lexical/Nodes/AllNodes'
import { MarkdownTransformers } from '../MarkdownTransformers'
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html'

export class HeadlessSuperConverter implements SuperConverterServiceInterface {
  private editor: LexicalEditor

  constructor() {
    this.editor = createHeadlessEditor({
      namespace: 'BlocksEditor',
      theme: BlocksEditorTheme,
      editable: false,
      onError: (error: Error) => console.error(error),
      nodes: [...BlockEditorNodes],
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

  convertSuperStringToOtherFormat(superString: string, toFormat: 'txt' | 'md' | 'html' | 'json'): string {
    if (superString.length === 0) {
      return superString
    }

    this.editor.setEditorState(this.editor.parseEditorState(superString))

    let content: string | undefined

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

    if (fromFormat === 'html') {
      this.editor.update(
        () => {
          const root = $getRoot()
          root.clear()

          const parser = new DOMParser()
          const dom = parser.parseFromString(otherFormatString, 'text/html')
          const generatedNodes = $generateNodesFromDOM(this.editor, dom)
          const nodesToInsert: LexicalNode[] = []
          generatedNodes.forEach((node) => {
            const type = node.getType()

            // Wrap text & link nodes with paragraph since they can't
            // be top-level nodes in Super
            if (type === 'text' || type === 'link') {
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
        },
        { discrete: true },
      )
    } else {
      this.editor.update(
        () => {
          $convertFromMarkdownString(otherFormatString, MarkdownTransformers)
        },
        {
          discrete: true,
        },
      )
    }

    return JSON.stringify(this.editor.getEditorState())
  }
}
