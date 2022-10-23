import { KeyboardKey } from '@standardnotes/ui-services'
import { FOCUSABLE_BUT_NOT_TABBABLE } from '@/Constants/Constants'
import { useCallback, useEffect, RefObject, useRef } from 'react'

export const useListKeyboardNavigation = (container: RefObject<HTMLElement | null>, initialFocus = 0) => {
  const listItems = useRef<HTMLButtonElement[]>([])
  const focusedItemIndex = useRef<number>(initialFocus)

  const focusItemWithIndex = useCallback((index: number, items?: HTMLButtonElement[]) => {
    focusedItemIndex.current = index
    if (items && items.length > 0) {
      items[index]?.focus()
    } else {
      listItems.current[index]?.focus()
    }
  }, [])

  useEffect(() => {
    if (container.current) {
      container.current.tabIndex = FOCUSABLE_BUT_NOT_TABBABLE
      listItems.current = Array.from(container.current.querySelectorAll('button'))
    }
  }, [container])

  const keyDownHandler = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === KeyboardKey.Up || e.key === KeyboardKey.Down) {
        e.preventDefault()
      } else {
        return
      }

      listItems.current = Array.from(container.current?.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)

      if (e.key === KeyboardKey.Up) {
        let previousIndex = focusedItemIndex.current - 1
        if (previousIndex < 0) {
          previousIndex = listItems.current.length - 1
        }
        focusItemWithIndex(previousIndex)
      }

      if (e.key === KeyboardKey.Down) {
        let nextIndex = focusedItemIndex.current + 1
        if (nextIndex > listItems.current.length - 1) {
          nextIndex = 0
        }
        focusItemWithIndex(nextIndex)
      }
    },
    [container, focusItemWithIndex],
  )

  const FIRST_ITEM_FOCUS_TIMEOUT = 20

  const containerFocusHandler = useCallback(() => {
    const items = Array.from(container.current?.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
    listItems.current = items

    if (items.length < 1) {
      return
    }

    const selectedItemIndex = Array.from(items).findIndex((item) => item.dataset.selected)
    const indexToFocus = selectedItemIndex > -1 ? selectedItemIndex : initialFocus

    setTimeout(() => {
      focusItemWithIndex(indexToFocus, items)
    }, FIRST_ITEM_FOCUS_TIMEOUT)
  }, [container, focusItemWithIndex, initialFocus])

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
