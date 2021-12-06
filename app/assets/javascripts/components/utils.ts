import { FunctionComponent, h, render } from 'preact';
import { unmountComponentAtNode } from 'preact/compat';
import { StateUpdater, useCallback, useState, useEffect } from 'preact/hooks';

/**
 * @returns a callback that will close a dropdown if none of its children has
 * focus. Use the returned function as the onBlur callback of children that need to be
 * monitored.
 */
export function useCloseOnBlur(
  container: { current?: HTMLDivElement },
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
  container: { current: HTMLDivElement },
  setOpen: (open: boolean) => void
): void {
  const closeOnClickOutside = useCallback(
    (event: { target: EventTarget | null }) => {
      if (!container.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    },
    [container, setOpen]
  );

  useEffect(() => {
    document.addEventListener('click', closeOnClickOutside);
    return () => {
      document.removeEventListener('click', closeOnClickOutside);
    };
  }, [closeOnClickOutside]);
}

export function toDirective<Props>(
  component: FunctionComponent<Props>,
  scope: Record<string, '=' | '&' | '@'> = {}
) {
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  return function () {
    return {
      controller: [
        '$element',
        '$scope',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ($element: JQLite, $scope: any) => {
          if ($scope.class) {
            $element.addClass($scope.class);
          }
          return {
            $onChanges() {
              render(h(component, $scope), $element[0]);
            },
            $onDestroy() {
              unmountComponentAtNode($element[0]);
            },
          };
        },
      ],
      scope: {
        application: '=',
        appState: '=',
        ...scope,
      },
    };
  };
}
