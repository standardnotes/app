import { TypeaheadOption } from '@lexical/react/LexicalTypeaheadMenuPlugin'

export class BlockPickerOption extends TypeaheadOption {
  // What shows up in the editor
  title: string
  // Icon for display
  iconName?: string
  // For extra searching.
  keywords: Array<string>
  // TBD
  keyboardShortcut?: string
  // What happens when you select this option?
  onSelect: (queryString: string) => void

  constructor(
    title: string,
    options: {
      iconName?: string
      keywords?: Array<string>
      keyboardShortcut?: string
      onSelect: (queryString: string) => void
    },
  ) {
    super(title)
    this.title = title
    this.keywords = options.keywords || []
    this.iconName = options.iconName
    this.keyboardShortcut = options.keyboardShortcut
    this.onSelect = options.onSelect.bind(this)
  }
}
