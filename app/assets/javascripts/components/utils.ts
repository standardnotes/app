import { autorun } from 'mobx';
import { FunctionComponent, h, render } from 'preact';
import { Inputs, useEffect, useState } from 'preact/hooks';

export function useAutorunValue<T>(query: () => T, inputs: Inputs): T {
  const [value, setValue] = useState(query);
  useEffect(() => {
    return autorun(() => {
      setValue(query());
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, inputs);
  return value;
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
