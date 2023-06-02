import { LexicalIconName } from '@/Components/Icon/LexicalIcons'
import { MenuOption } from '@lexical/react/LexicalTypeaheadMenuPlugin'
import { IconType } from '@standardnotes/snjs'

export class BlockPickerOption extends MenuOption {
  title: string
  iconName: IconType | LexicalIconName
  keywords: Array<string>
  keyboardShortcut?: string
  onSelect: (queryString: string) => void

  constructor(
    title: string,
    options: {
      iconName: IconType | LexicalIconName
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
