import { KeyboardKey } from '@standardnotes/ui-services'
import { FOCUSABLE_BUT_NOT_TABBABLE } from '@/Constants/Constants'
import { useCallback, useState, useEffect, RefObject } from 'react'

export const useListKeyboardNavigation = (container: RefObject<HTMLElement | null>, initialFocus = 0) => {
  const [listItems, setListItems] = useState<HTMLButtonElement[]>()
  const [focusedItemIndex, setFocusedItemIndex] = useState<number>(initialFocus)

  const focusItemWithIndex = useCallback(
    (index: number, items?: HTMLButtonElement[]) => {
      setFocusedItemIndex(index)
      if (items && items.length > 0) {
        items[index]?.focus()
      } else {
        listItems?.[index]?.focus()
      }
    },
    [listItems],
  )

  useEffect(() => {
    if (container.current) {
      container.current.tabIndex = FOCUSABLE_BUT_NOT_TABBABLE
      setListItems(Array.from(container.current.querySelectorAll('button')))
    }
  }, [container])

  const keyDownHandler = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === KeyboardKey.Up || e.key === KeyboardKey.Down) {
        e.preventDefault()
      } else {
        return
      }

      if (!listItems?.length) {
        setListItems(Array.from(container.current?.querySelectorAll('button') as NodeListOf<HTMLButtonElement>))
      }

      if (listItems) {
        if (e.key === KeyboardKey.Up) {
          let previousIndex = focusedItemIndex - 1
          if (previousIndex < 0) {
            previousIndex = listItems.length - 1
          }
          focusItemWithIndex(previousIndex)
        }

        if (e.key === KeyboardKey.Down) {
          let nextIndex = focusedItemIndex + 1
          if (nextIndex > listItems.length - 1) {
            nextIndex = 0
          }
          focusItemWithIndex(nextIndex)
        }
      }
    },
    [container, focusItemWithIndex, focusedItemIndex, listItems],
  )

  const FIRST_ITEM_FOCUS_TIMEOUT = 20

  const containerFocusHandler = useCallback(() => {
    let temporaryItems = listItems && listItems?.length > 0 ? listItems : []
    if (!temporaryItems.length) {
      temporaryItems = Array.from(container.current?.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      setListItems(temporaryItems)
    }
    if (temporaryItems.length > 0) {
      const selectedItemIndex = Array.from(temporaryItems).findIndex((item) => item.dataset.selected)
      const indexToFocus = selectedItemIndex > -1 ? selectedItemIndex : initialFocus
      setTimeout(() => {
        focusItemWithIndex(indexToFocus, temporaryItems)
      }, FIRST_ITEM_FOCUS_TIMEOUT)
    }
  }, [container, focusItemWithIndex, initialFocus, listItems])

  useEffect(() => {
    const containerElement = container.current
    containerElement?.addEventListener('focus', containerFocusHandler)
    containerElement?.addEventListener('keydown', keyDownHandler)

    return () => {
      containerElement?.removeEventListener('focus', containerFocusHandler)
      containerElement?.removeEventListener('keydown', keyDownHandler)
    }
  }, [container, containerFocusHandler, keyDownHandler])
}
