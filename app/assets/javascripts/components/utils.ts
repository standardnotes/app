import { FunctionComponent, h, render } from 'preact';
import { StateUpdater, useCallback, useState } from 'preact/hooks';

/**
 * @returns a callback that will close a dropdown if none of its children has
 * focus. Must be set as the onBlur callback of children that need to be
 * monitored.
 */
export function useCloseOnBlur(
  container: { current: HTMLDivElement },
  setOpen: (open: boolean) => void
): [
  (event: {
    relatedTarget: EventTarget | null;
    target: EventTarget | null;
  }) => void,
  StateUpdater<boolean>
] {
  const [locked, setLocked] = useState(false);
  return [
    useCallback(
      function onBlur(event: {
        relatedTarget: EventTarget | null;
        target: EventTarget | null;
      }) {
        if (
          !locked &&
          !container.current?.contains(event.relatedTarget as Node) &&
          !container.current?.contains(event.target as Node)
        ) {
          setOpen(false);
        }
      },
      [container, setOpen, locked]
    ),
    setLocked,
  ];
}

export function toDirective<Props>(
  component: FunctionComponent<Props>,
  scope: Record<string, '=' | '&'> = {}
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
