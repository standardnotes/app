import { TypeaheadOption } from '@lexical/react/LexicalTypeaheadMenuPlugin'

export class ItemOption extends TypeaheadOption {
  // What shows up in the editor
  title: string
  // Icon for display
  icon?: JSX.Element
  // For extra searching.
  keywords: Array<string>
  // TBD
  keyboardShortcut?: string
  // What happens when you select this option?
  onSelect: (queryString: string) => void

  constructor(
    title: string,
    key: string,
    options: {
      icon?: JSX.Element
      keywords?: Array<string>
      keyboardShortcut?: string
      onSelect: (queryString: string) => void
    },
  ) {
    super(title)
    this.title = title
    this.key = key
    this.keywords = options.keywords || []
    this.icon = options.icon
    this.keyboardShortcut = options.keyboardShortcut
    this.onSelect = options.onSelect.bind(this)
  }
}
