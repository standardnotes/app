import {
  DOMConversionMap,
  DOMExportOutput,
  EditorConfig,
  ElementFormatType,
  LexicalEditor,
  LexicalUpdateJSON,
  NodeKey,
} from 'lexical'
import { DecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode'
import { $createFileNode, convertToFileElement } from './FileUtils'
import FileComponent from './FileComponent'
import { SerializedFileNode } from './SerializedFileNode'
import { ItemNodeInterface } from '../../ItemNodeInterface'

export class FileNode extends DecoratorBlockNode implements ItemNodeInterface {
  __id: string
  __zoomLevel: number

  static getType(): string {
    return 'snfile'
  }

  constructor(id: string, format?: ElementFormatType, key?: NodeKey, zoomLevel?: number) {
    super(format, key)
    this.__id = id
    this.__zoomLevel = zoomLevel || 100
  }

  static clone(node: FileNode): FileNode {
    return new FileNode(node.__id, node.__format, node.__key, node.__zoomLevel)
  }

  static importJSON(serializedNode: SerializedFileNode): FileNode {
    return $createFileNode(serializedNode.fileUuid).updateFromJSON(serializedNode)
  }

  updateFromJSON(serializedNode: LexicalUpdateJSON<SerializedFileNode>): this {
    return super.updateFromJSON(serializedNode).setZoomLevel(serializedNode.zoomLevel)
  }

  exportJSON(): SerializedFileNode {
    return {
      ...super.exportJSON(),
      fileUuid: this.getId(),
      zoomLevel: this.__zoomLevel,
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
    const element = document.createElement('span')
    element.setAttribute('data-lexical-file-uuid', this.__id)
    const text = document.createTextNode(this.getTextContent())
    element.append(text)
    return { element }
  }

  getId(): string {
    return this.__id
  }

  getTextContent(_includeInert?: boolean | undefined, _includeDirectionless?: false | undefined): string {
    return `[File: ${this.__id}]`
  }

  setZoomLevel(zoomLevel: number): this {
    const self = this.getWritable()
    self.__zoomLevel = zoomLevel
    return self
  }

  decorate(_editor: LexicalEditor, config: EditorConfig): JSX.Element {
    const embedBlockTheme = config.theme.embedBlock || {}
    const className = {
      base: embedBlockTheme.base || '',
      focus: embedBlockTheme.focus || '',
    }

    return (
      <FileComponent
        className={className}
        format={this.__format}
        nodeKey={this.getKey()}
        fileUuid={this.__id}
        zoomLevel={this.__zoomLevel}
        setZoomLevel={this.setZoomLevel.bind(this)}
      />
    )
  }
}
