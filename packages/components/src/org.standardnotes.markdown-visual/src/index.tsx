import './stylesheets/main.scss'

import { Component, createRef, StrictMode } from 'react'
import ReactDOM from 'react-dom'

import CodeMirrorEditor, { CodeMirrorRef } from './components/CodeMirror'
import MilkdownEditor, { MilkdownRef } from './components/Milkdown'
import SplitView, { SplitViewDirection } from './components/SplitView'

import EditorKit, { EditorKitDelegate } from '@standardnotes/editor-kit'
import { marked } from 'marked'

import { MenuConfig, menuConfig } from './components/Milkdown/plugins/advanced-menu/config'

enum TextChangeSource {
  Milkdown = 'milkdown',
  CodeMirror = 'codemirror',
}

type AppProps = {}
type AppState = {
  splitView: boolean
  editable: boolean
  spellcheck: boolean
  isLoading: boolean
}

class AppWrapper extends Component<AppProps, AppState> {
  private editorKit?: EditorKit
  private prevText: string = ''

  private milkdownRef = createRef<MilkdownRef>()
  private codeMirrorRef = createRef<CodeMirrorRef>()

  constructor(props: AppProps) {
    super(props)

    this.state = {
      splitView: false,
      editable: true,
      spellcheck: true,
      isLoading: true,
    }
  }

  componentDidMount() {
    this.configureEditorKit()
  }

  private configureEditorKit() {
    const editorKitDelegate: EditorKitDelegate = {
      setEditorRawText: (text: string) => {
        this.prevText = text.trim()

        this.updateMilkdownText(this.prevText)
        this.updateCodeMirrorText(this.prevText)

        this.setState({
          isLoading: false,
        })
      },
      generateCustomPreview: (text: string) => {
        const htmlPreview = marked.parse(text)
        const tmpElement = document.createElement('div')
        tmpElement.innerHTML = htmlPreview

        const preview = tmpElement.textContent || tmpElement.innerText || ''

        return {
          plain: this.truncateString(preview).trim(),
        }
      },
      onNoteValueChange: async (note: any) => {
        const editable = !note.content.appData['org.standardnotes.sn'].locked ?? true
        const spellcheck = note.content.spellcheck

        this.setState({
          editable,
          spellcheck,
        })
      },
      onNoteLockToggle: (locked: boolean) => {
        const editable = !locked

        this.setState({
          editable,
        })
      },
    }

    this.editorKit = new EditorKit(editorKitDelegate, {
      mode: 'markdown',
      supportsFileSafe: false,
    })
  }

  private updateMilkdownText(text: string) {
    const { current } = this.milkdownRef
    if (current) {
      current.update(text)
    }
  }

  private updateCodeMirrorText(text: string) {
    const { current } = this.codeMirrorRef
    if (current) {
      current.update(text)
    }
  }

  private onTextChange = (text: string, source = TextChangeSource.Milkdown) => {
    if (this.prevText === text.trim()) {
      return
    }

    this.prevText = text.trim()
    this.editorKit!.onEditorValueChanged(text)

    /**
     * Bi-directional text update:
     *
     * - Codemirror <- Milkdown
     * - Milkdown -> Codemirror
     */
    switch (source) {
      case TextChangeSource.CodeMirror:
        this.updateMilkdownText(this.prevText)
        break
      case TextChangeSource.Milkdown:
      default:
        this.updateCodeMirrorText(this.prevText)
        break
    }
  }

  private toggleSplitView = () => {
    const { splitView } = this.state

    this.setState({
      splitView: !splitView,
    })
  }

  private getSplitViewDirection = (environment: string): SplitViewDirection => {
    const environmentDirectionMap: Record<string, SplitViewDirection> = {
      web: SplitViewDirection.Horizontal,
      desktop: SplitViewDirection.Horizontal,
      mobile: SplitViewDirection.Vertical,
    }
    return environmentDirectionMap[environment]
  }

  private truncateString(text: string, limit = 90) {
    if (text.length <= limit) {
      return text
    }
    return text.substring(0, limit) + '...'
  }

  render() {
    const { splitView, editable, spellcheck, isLoading } = this.state

    if (isLoading) {
      return null
    }

    const environment = this.editorKit?.environment ?? 'web'
    const splitViewDirection = this.getSplitViewDirection(environment)

    const customMenu: MenuConfig = [
      ...menuConfig,
      [
        {
          type: 'button',
          icon: 'code',
          active: () => splitView,
          callback: this.toggleSplitView,
          alwaysVisible: true,
        },
      ],
    ]

    return (
      <SplitView split={splitView} direction={splitViewDirection}>
        <MilkdownEditor
          ref={this.milkdownRef}
          onChange={this.onTextChange}
          value={this.prevText}
          menuConfig={customMenu}
          editable={editable}
          spellcheck={spellcheck}
        />
        <CodeMirrorEditor
          ref={this.codeMirrorRef}
          onChange={(text) => this.onTextChange(text, TextChangeSource.CodeMirror)}
          value={this.prevText}
          editable={editable}
          spellcheck={spellcheck}
        />
      </SplitView>
    )
  }
}

ReactDOM.render(
  <StrictMode>
    <AppWrapper />
  </StrictMode>,
  document.getElementById('root'),
)
