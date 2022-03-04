import { AppState } from '@/ui_models/app_state';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { SmartViewsListItem } from './SmartViewsListItem';

type Props = {
  appState: AppState;
};

export const SmartViewsList: FunctionComponent<Props> = observer(
  ({ appState }) => {
    const allViews = appState.tags.smartViews;

    return (
      <>
        {allViews.map((view) => {
          return (
            <SmartViewsListItem
              key={view.uuid}
              view={view}
              tagsState={appState.tags}
              features={appState.features}
            />
          );
        })}
      </>
    );
  }
);
