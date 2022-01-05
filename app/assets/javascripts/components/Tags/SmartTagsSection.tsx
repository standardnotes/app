import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { SmartTagsList } from './SmartTagsList';

type Props = {
  appState: AppState;
};

export const SmartTagsSection: FunctionComponent<Props> = observer(
  ({ appState }) => {
    return (
      <section>
        <SmartTagsList appState={appState} />
      </section>
    );
  }
);
