import { FunctionalComponent } from 'preact';
import { PreferencesGroup, PreferencesSegment, Title } from '@/preferences/components';
import { OfflineSubscription } from '@/preferences/panes/account/offlineSubscription';
import { WebApplication } from '@/ui_models/application';
import { observer } from 'mobx-react-lite';
import { AppState } from '@/ui_models/app_state';

interface IProps {
  application: WebApplication;
  appState: AppState;
}

export const Advanced: FunctionalComponent<IProps> = observer(({ application, appState }) => {
  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <div className='flex flex-row items-center'>
          <div className='flex-grow flex flex-col'>
            <Title>Advanced Settings</Title>
            <OfflineSubscription application={application} appState={appState} />
          </div>
        </div>
      </PreferencesSegment>
    </PreferencesGroup>
  );
});
