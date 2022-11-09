import { LexicalIconName } from '@/Components/Icon/LexicalIcons'
import { TypeaheadOption } from '@lexical/react/LexicalTypeaheadMenuPlugin'

export class BlockPickerOption extends TypeaheadOption {
  title: string
  iconName: LexicalIconName
  keywords: Array<string>
  keyboardShortcut?: string
  onSelect: (queryString: string) => void

  constructor(
    title: string,
    options: {
      iconName: LexicalIconName
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
