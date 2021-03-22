import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
import { autorun, IAutorunOptions, IReactionPublic } from 'mobx';
import { FunctionComponent, h, render } from 'preact';
import { useEffect } from 'preact/hooks';
import { useState } from 'react';

export function useAutorunValue<T>(query: () => T): T {
  const [value, setValue] = useState(query);
  useAutorun(() => {
    setValue(query());
  });
  return value;
}

export function useAutorun(
  view: (r: IReactionPublic) => unknown,
  opts?: IAutorunOptions
): void {
  useEffect(() => autorun(view, opts), [view, opts]);
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
          return {
            $onChanges() {
              render(
                h(component, $scope),
                $element[0]
              );
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
