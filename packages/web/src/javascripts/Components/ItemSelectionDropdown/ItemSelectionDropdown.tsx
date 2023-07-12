import { doesItemMatchSearchQuery } from '@/Utils/Items/Search/doesItemMatchSearchQuery'
import {
  Combobox,
  ComboboxItem,
  ComboboxPopover,
  ComboboxStoreProps,
  useComboboxStore,
  VisuallyHidden,
} from '@ariakit/react'
import { classNames, DecryptedItem, naturalSort } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { useDeferredValue, useEffect, useState } from 'react'
import { useApplication } from '../ApplicationProvider'
import LinkedItemMeta from '../LinkedItems/LinkedItemMeta'

type Props = {
  contentTypes: string[]
  placeholder: string
  onSelection: (item: DecryptedItem) => void
  className?: {
    input?: string
    popover?: string
  }
  comboboxProps?: ComboboxStoreProps
}

const ItemSelectionDropdown = ({ contentTypes, placeholder, onSelection, comboboxProps, className = {} }: Props) => {
  const application = useApplication()

  const combobox = useComboboxStore(comboboxProps)
  const value = combobox.useState('value')
  const open = combobox.useState('open')
  useEffect(() => {
    if (value.length < 1 && open) {
      combobox.setOpen(false)
    }
  }, [combobox, open, value.length])

  const searchQuery = useDeferredValue(value)
  const [items, setItems] = useState<DecryptedItem[]>([])

  useEffect(() => {
    const searchableItems = naturalSort(application.items.getItems(contentTypes), 'title')
    const filteredItems = searchableItems.filter((item) => {
      return doesItemMatchSearchQuery(item, searchQuery, application)
    })
    setItems(filteredItems)
  }, [searchQuery, application, contentTypes])

  return (
    <div>
      <VisuallyHidden>Select an item</VisuallyHidden>
      <Combobox
        store={combobox}
        placeholder={placeholder}
        className={classNames(
          'h-7 w-70 bg-transparent text-sm text-text focus:border-b-2 focus:border-info focus:shadow-none focus:outline-none lg:text-xs',
          className.input,
        )}
      />
      <ComboboxPopover
        store={combobox}
        className={classNames(
          'z-dropdown-menu max-h-[var(--popover-available-height)] w-[var(--popover-anchor-width)] overflow-y-auto rounded bg-default py-2 shadow-main',
          className.popover,
        )}
      >
        {items.length > 0 ? (
          items.map((item) => (
            <ComboboxItem
              key={item.uuid}
              className="flex w-full cursor-pointer items-center justify-between gap-4 overflow-hidden px-3 py-2 hover:bg-contrast hover:text-foreground [&[data-active-item]]:bg-info-backdrop"
              hideOnClick
              onClick={() => {
                combobox.setValue('')
                onSelection(item)
              }}
            >
              <LinkedItemMeta item={item} searchQuery={searchQuery} />
            </ComboboxItem>
          ))
        ) : (
          <div className="px-2">No results found</div>
        )}
      </ComboboxPopover>
    </div>
  )
}

export default observer(ItemSelectionDropdown)
