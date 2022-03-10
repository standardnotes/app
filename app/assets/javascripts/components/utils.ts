import { KeyboardKey } from '@/services/ioService';
import { FOCUSABLE_BUT_NOT_TABBABLE, MILLISECONDS_IN_A_DAY } from '@/constants';
import {
  StateUpdater,
  useCallback,
  useState,
  useEffect,
  Ref,
} from 'preact/hooks';

/**
 * @returns a callback that will close a dropdown if none of its children has
 * focus. Use the returned function as the onBlur callback of children that need to be
 * monitored.
 */
export function useCloseOnBlur(
  container: { current?: HTMLDivElement | null },
  setOpen: (open: boolean) => void
): [
  (event: { relatedTarget: EventTarget | null }) => void,
  StateUpdater<boolean>
] {
  const [locked, setLocked] = useState(false);
  return [
    useCallback(
      function onBlur(event: { relatedTarget: EventTarget | null }) {
        if (
          !locked &&
          !container.current?.contains(event.relatedTarget as Node)
        ) {
          setOpen(false);
        }
      },
      [container, setOpen, locked]
    ),
    setLocked,
  ];
}

export function useCloseOnClickOutside(
  container: { current: HTMLDivElement | null },
  callback: () => void
): void {
  const closeOnClickOutside = useCallback(
    (event: { target: EventTarget | null }) => {
      if (!container.current) {
        return;
      }
      const isDescendantOfContainer = container.current.contains(
        event.target as Node
      );
      const isDescendantOfDialog = (event.target as HTMLElement).closest(
        '[role="dialog"]'
      );
      if (!isDescendantOfContainer && !isDescendantOfDialog) {
        callback();
      }
    },
    [container, callback]
  );

  useEffect(() => {
    document.addEventListener('click', closeOnClickOutside, { capture: true });
    return () => {
      document.removeEventListener('click', closeOnClickOutside, {
        capture: true,
      });
    };
  }, [closeOnClickOutside]);
}

export const calculateDifferenceBetweenDatesInDays = (
  firstDate: Date,
  secondDate: Date
) => {
  const firstDateAsUTCMilliseconds = Date.UTC(
    firstDate.getFullYear(),
    firstDate.getMonth(),
    firstDate.getDate()
  );

  const secondDateAsUTCMilliseconds = Date.UTC(
    secondDate.getFullYear(),
    secondDate.getMonth(),
    secondDate.getDate()
  );

  return Math.round(
    (firstDateAsUTCMilliseconds - secondDateAsUTCMilliseconds) /
      MILLISECONDS_IN_A_DAY
  );
};

export const useListKeyboardNavigation = (
  container: Ref<HTMLElement | null>
) => {
  const [listItems, setListItems] = useState<HTMLButtonElement[]>();
  const [focusedItemIndex, setFocusedItemIndex] = useState<number>(0);

  const focusItemWithIndex = useCallback(
    (index: number, items?: HTMLButtonElement[]) => {
      setFocusedItemIndex(index);
      if (items && items.length > 0) {
        items[index]?.focus();
      } else {
        listItems?.[index]?.focus();
      }
    },
    [listItems]
  );

  useEffect(() => {
    if (container.current) {
      container.current.tabIndex = FOCUSABLE_BUT_NOT_TABBABLE;
      setListItems(Array.from(container.current.querySelectorAll('button')));
    }
  }, [container]);

  const keyDownHandler = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === KeyboardKey.Up || e.key === KeyboardKey.Down) {
        e.preventDefault();
      } else {
        return;
      }

      if (!listItems?.length) {
        setListItems(
          Array.from(
            container.current?.querySelectorAll(
              'button'
            ) as NodeListOf<HTMLButtonElement>
          )
        );
      }

      if (listItems) {
        if (e.key === KeyboardKey.Up) {
          let previousIndex = focusedItemIndex - 1;
          if (previousIndex < 0) {
            previousIndex = listItems.length - 1;
          }
          focusItemWithIndex(previousIndex);
        }

        if (e.key === KeyboardKey.Down) {
          let nextIndex = focusedItemIndex + 1;
          if (nextIndex > listItems.length - 1) {
            nextIndex = 0;
          }
          focusItemWithIndex(nextIndex);
        }
      }
    },
    [container, focusItemWithIndex, focusedItemIndex, listItems]
  );

  const FIRST_ITEM_FOCUS_TIMEOUT = 20;

  const containerFocusHandler = useCallback(() => {
    let temporaryItems = listItems && listItems?.length > 0 ? listItems : [];
    if (!temporaryItems.length) {
      temporaryItems = Array.from(
        container.current?.querySelectorAll(
          'button'
        ) as NodeListOf<HTMLButtonElement>
      );
      setListItems(temporaryItems);
    }
    if (temporaryItems.length > 0) {
      const selectedItemIndex = Array.from(temporaryItems).findIndex(
        (item) => item.dataset.selected
      );
      const indexToFocus = selectedItemIndex > -1 ? selectedItemIndex : 0;
      setTimeout(() => {
        focusItemWithIndex(indexToFocus, temporaryItems);
      }, FIRST_ITEM_FOCUS_TIMEOUT);
    }
  }, [container, focusItemWithIndex, listItems]);

  useEffect(() => {
    const containerElement = container.current;
    containerElement?.addEventListener('focus', containerFocusHandler);
    containerElement?.addEventListener('keydown', keyDownHandler);

    return () => {
      containerElement?.removeEventListener('focus', containerFocusHandler);
      containerElement?.removeEventListener('keydown', keyDownHandler);
    };
  }, [container, containerFocusHandler, keyDownHandler]);
};
