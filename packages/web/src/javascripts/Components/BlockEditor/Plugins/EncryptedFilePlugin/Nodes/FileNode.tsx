import { DOMConversionMap, DOMExportOutput, EditorConfig, ElementFormatType, LexicalEditor, NodeKey } from 'lexical'
import { DecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode'
import { $createFileNode, convertToFileElement } from './FileUtils'
import { FileComponent } from './FileComponent'
import { SerializedFileNode } from './SerializedFileNode'

export class FileNode extends DecoratorBlockNode {
  __id: string

  static getType(): string {
    return 'snfile'
  }

  static clone(node: FileNode): FileNode {
    return new FileNode(node.__id, node.__format, node.__key)
  }

  static importJSON(serializedNode: SerializedFileNode): FileNode {
    const node = $createFileNode(serializedNode.fileUuid)
    node.setFormat(serializedNode.format)
    return node
  }

  exportJSON(): SerializedFileNode {
    return {
      ...super.exportJSON(),
      fileUuid: this.getId(),
      version: 1,
      type: 'snfile',
    }
  }

  static importDOM(): DOMConversionMap<HTMLDivElement> | null {
    return {
      div: (domNode: HTMLDivElement) => {
        if (!domNode.hasAttribute('data-lexical-file-uuid')) {
          return null
        }
        return {
          conversion: convertToFileElement,
          priority: 2,
        }
      },
    }
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('div')
    element.setAttribute('data-lexical-file-uuid', this.__id)
    const text = document.createTextNode(this.getTextContent())
    element.append(text)
    return { element }
  }

  constructor(id: string, format?: ElementFormatType, key?: NodeKey) {
    super(format, key)
    this.__id = id
  }

  getId(): string {
    return this.__id
  }

  getTextContent(_includeInert?: boolean | undefined, _includeDirectionless?: false | undefined): string {
    return `[File: ${this.__id}]`
  }

  decorate(_editor: LexicalEditor, config: EditorConfig): JSX.Element {
    console.log('FileNode decorate > _editor', _editor)
    const embedBlockTheme = config.theme.embedBlock || {}
    const className = {
      base: embedBlockTheme.base || '',
      focus: embedBlockTheme.focus || '',
    }

    return <FileComponent className={className} format={this.__format} nodeKey={this.getKey()} fileUuid={this.__id} />
  }

  isInline(): false {
    return false
  }
}
