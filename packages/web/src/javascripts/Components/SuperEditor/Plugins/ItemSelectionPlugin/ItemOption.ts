import { MenuOption } from '@lexical/react/LexicalTypeaheadMenuPlugin'
import { LinkableItem } from '@/Utils/Items/Search/LinkableItem'

export class ItemOption extends MenuOption {
  constructor(
    public item: LinkableItem | undefined,
    public label: string,
    public options: {
      keywords?: Array<string>
      keyboardShortcut?: string
      onSelect: (queryString: string) => void
    },
  ) {
    super(label || '')
    this.key = item?.uuid || label
  }
}
