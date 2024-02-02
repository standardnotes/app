import { KeyboardKey } from '@standardnotes/ui-services'
import { FOCUSABLE_BUT_NOT_TABBABLE } from '@/Constants/Constants'
import { useCallback, useEffect, useRef } from 'react'

type Options = {
  initialFocus?: number
  shouldAutoFocus?: boolean
  shouldWrapAround?: boolean
  resetLastFocusedOnBlur?: boolean
}

export const useListKeyboardNavigation = (containerElement: HTMLElement | null, options?: Options) => {
  const {
    initialFocus = 0,
    shouldAutoFocus = false,
    shouldWrapAround = true,
    resetLastFocusedOnBlur = false,
  } = options || {}

  const listItems = useRef<HTMLButtonElement[]>([])
  const setLatestListItems = useCallback(() => {
    if (!containerElement) {
      return
    }
    listItems.current = Array.from(containerElement.querySelectorAll('button, div[role="button"]'))
    if (listItems.current[0]) {
      listItems.current[0].tabIndex = 0
    }
  }, [containerElement])

  const focusedItemIndex = useRef<number>(initialFocus)

  const focusItemWithIndex = useCallback((index: number) => {
    focusedItemIndex.current = index
    listItems.current[index]?.focus()
  }, [])

  const getNextFocusableIndex = useCallback(
    (currentIndex: number, items: HTMLButtonElement[]) => {
      let nextIndex = currentIndex + 1
      if (nextIndex > items.length - 1) {
        nextIndex = shouldWrapAround ? 0 : currentIndex
      }
      while (items[nextIndex].disabled) {
        nextIndex++
        if (nextIndex > items.length - 1) {
          nextIndex = shouldWrapAround ? 0 : currentIndex
        }
      }
      return nextIndex
    },
    [shouldWrapAround],
  )

  const getPreviousFocusableIndex = useCallback(
    (currentIndex: number, items: HTMLButtonElement[]) => {
      let previousIndex = currentIndex - 1
      if (previousIndex < 0) {
        previousIndex = shouldWrapAround ? items.length - 1 : currentIndex
      }
      while (items[previousIndex].disabled) {
        previousIndex--
        if (previousIndex < 0) {
          previousIndex = shouldWrapAround ? items.length - 1 : currentIndex
        }
      }
      return previousIndex
    },
    [shouldWrapAround],
  )

  useEffect(() => {
    if (containerElement) {
      containerElement.tabIndex = FOCUSABLE_BUT_NOT_TABBABLE
      setLatestListItems()
      if (listItems.current[0]) {
        listItems.current[0].tabIndex = 0
      }
    }
  }, [containerElement, setLatestListItems])

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

      if (e.key === KeyboardKey.Up) {
        const previousIndex = getPreviousFocusableIndex(focusedItemIndex.current, listItems.current)
        focusItemWithIndex(previousIndex)
      }

      if (e.key === KeyboardKey.Down) {
        const nextIndex = getNextFocusableIndex(focusedItemIndex.current, listItems.current)
        focusItemWithIndex(nextIndex)
      }
    },
    [focusItemWithIndex, getNextFocusableIndex, getPreviousFocusableIndex],
  )

  const FIRST_ITEM_FOCUS_TIMEOUT = 20

  const setInitialFocus = useCallback(() => {
    const items = listItems.current

    if (items.length < 1) {
      return
    }

    const selectedItemIndex = Array.from(items).findIndex((item) => item.dataset.selected)
    let indexToFocus = selectedItemIndex > -1 ? selectedItemIndex : initialFocus
    indexToFocus = getNextFocusableIndex(indexToFocus - 1, items)

    focusItemWithIndex(indexToFocus)
  }, [focusItemWithIndex, getNextFocusableIndex, initialFocus])

  useEffect(() => {
    if (shouldAutoFocus) {
      setTimeout(() => {
        setInitialFocus()
      }, FIRST_ITEM_FOCUS_TIMEOUT)
    }
  }, [setInitialFocus, shouldAutoFocus])

  const focusOutHandler = useCallback(
    (event: FocusEvent) => {
      const isFocusInContainer = containerElement && containerElement.contains(event.relatedTarget as Node)
      if (isFocusInContainer || !resetLastFocusedOnBlur) {
        return
      }
      focusedItemIndex.current = initialFocus
    },
    [containerElement, initialFocus, resetLastFocusedOnBlur],
  )

  useEffect(() => {
    if (!containerElement) {
      return
    }

    containerElement.addEventListener('keydown', keyDownHandler)
    containerElement.addEventListener('focusout', focusOutHandler)

    const containerMutationObserver = new MutationObserver(() => {
      setLatestListItems()
    })

    containerMutationObserver.observe(containerElement, {
      childList: true,
      subtree: true,
    })

    return () => {
      containerElement.removeEventListener('keydown', keyDownHandler)
      containerElement.removeEventListener('focusout', focusOutHandler)
      containerMutationObserver.disconnect()
    }
  }, [setInitialFocus, keyDownHandler, focusOutHandler, containerElement, setLatestListItems])

  return {
    setInitialFocus,
  }
}
