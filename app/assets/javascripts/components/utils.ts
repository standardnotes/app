import { MILLISECONDS_IN_A_DAY } from '@/views/constants';
import { StateUpdater, useCallback, useState, useEffect } from 'preact/hooks';

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
      const isDescendant = container.current.contains(event.target as Node);
      if (!isDescendant) {
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
