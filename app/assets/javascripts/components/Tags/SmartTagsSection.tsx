import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { SmartTagsList } from './SmartTagsList';

type Props = {
  application: WebApplication;
  appState: AppState;
};

export const SmartTagsSection: FunctionComponent<Props> = observer(
  ({ application, appState }) => {
    return (
      <section>
        <SmartTagsList application={application} appState={appState} />
      </section>
    );
  }
);
