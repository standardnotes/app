import { FileItem } from '@standardnotes/snjs'
import { TypeaheadOption } from '@lexical/react/LexicalTypeaheadMenuPlugin'

export class ItemOption extends TypeaheadOption {
  icon?: JSX.Element

  constructor(
    public item: FileItem,
    public options: {
      keywords?: Array<string>
      keyboardShortcut?: string
      onSelect: (queryString: string) => void
    },
  ) {
    super(item.title)
    this.key = item.uuid
  }
}
