import { TypeaheadOption } from '@lexical/react/LexicalTypeaheadMenuPlugin'
import { LinkableItem } from '@/Utils/Items/Search/LinkableItem'

export class ItemOption extends TypeaheadOption {
  constructor(
    public item: LinkableItem,
    public options: {
      keywords?: Array<string>
      keyboardShortcut?: string
      onSelect: (queryString: string) => void
    },
  ) {
    super(item.title || '')
    this.key = item.uuid
  }
}
