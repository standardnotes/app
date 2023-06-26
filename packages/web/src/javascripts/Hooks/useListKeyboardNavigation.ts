import { KeyboardKey } from '@standardnotes/ui-services'
import { FOCUSABLE_BUT_NOT_TABBABLE } from '@/Constants/Constants'
import { useCallback, useEffect, RefObject, useRef } from 'react'

export const useListKeyboardNavigation = (
  container: RefObject<HTMLElement | null>,
  initialFocus = 0,
  shouldAutoFocus = false,
) => {
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

  const getNextFocusableIndex = useCallback((currentIndex: number, items: HTMLButtonElement[]) => {
    let nextIndex = currentIndex + 1
    if (nextIndex > items.length - 1) {
      nextIndex = 0
    }
    while (items[nextIndex].disabled) {
      nextIndex++
      if (nextIndex > items.length - 1) {
        nextIndex = 0
      }
    }
    return nextIndex
  }, [])

  const getPreviousFocusableIndex = useCallback((currentIndex: number, items: HTMLButtonElement[]) => {
    let previousIndex = currentIndex - 1
    if (previousIndex < 0) {
      previousIndex = items.length - 1
    }
    while (items[previousIndex].disabled) {
      previousIndex--
      if (previousIndex < 0) {
        previousIndex = items.length - 1
      }
    }
    return previousIndex
  }, [])

  useEffect(() => {
    if (container.current) {
      container.current.tabIndex = FOCUSABLE_BUT_NOT_TABBABLE
      listItems.current = Array.from(container.current.querySelectorAll('button'))
    }
  }, [container])

  const keyDownHandler = useCallback(
    (e: KeyboardEvent) => {
      const isFocusInInput = document.activeElement?.tagName === 'INPUT'
      const isFocusInListbox = !!document.activeElement?.closest('[role="listbox"]')

      if (isFocusInInput || isFocusInListbox) {
        return
      }

      if (e.key === KeyboardKey.Up || e.key === KeyboardKey.Down) {
        e.preventDefault()
      } else {
        return
      }

      listItems.current = Array.from(container.current?.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)

      if (e.key === KeyboardKey.Up) {
        const previousIndex = getPreviousFocusableIndex(focusedItemIndex.current, listItems.current)
        focusItemWithIndex(previousIndex)
      }

      if (e.key === KeyboardKey.Down) {
        const nextIndex = getNextFocusableIndex(focusedItemIndex.current, listItems.current)
        focusItemWithIndex(nextIndex)
      }
    },
    [container, focusItemWithIndex, getNextFocusableIndex, getPreviousFocusableIndex],
  )

  const FIRST_ITEM_FOCUS_TIMEOUT = 20

  const setInitialFocus = useCallback(() => {
    const items = Array.from(container.current?.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
    listItems.current = items

    if (items.length < 1) {
      return
    }

    const selectedItemIndex = Array.from(items).findIndex((item) => item.dataset.selected)
    let indexToFocus = selectedItemIndex > -1 ? selectedItemIndex : initialFocus
    indexToFocus = getNextFocusableIndex(indexToFocus - 1, items)

    focusItemWithIndex(indexToFocus, items)
  }, [container, focusItemWithIndex, getNextFocusableIndex, initialFocus])

  useEffect(() => {
    if (shouldAutoFocus) {
      setTimeout(() => {
        setInitialFocus()
      }, FIRST_ITEM_FOCUS_TIMEOUT)
    }
  }, [setInitialFocus, shouldAutoFocus])

  useEffect(() => {
    if (listItems.current.length > 0) {
      listItems.current[0].tabIndex = 0
    }
  }, [])

  useEffect(() => {
    const containerElement = container.current
    containerElement?.addEventListener('keydown', keyDownHandler)

    return () => {
      containerElement?.removeEventListener('keydown', keyDownHandler)
    }
  }, [container, setInitialFocus, keyDownHandler])

  return {
    setInitialFocus,
  }
}
