import { FunctionalComponent } from 'preact';
import { PreferencesGroup, PreferencesSegment, Subtitle, Text, Title } from '@/preferences/components';
import { OfflineSubscription } from '@/preferences/panes/account/offlineSubscription';
import { WebApplication } from '@/ui_models/application';
import { observer } from 'mobx-react-lite';

interface IProps {
  application: WebApplication;
}

export const Advanced: FunctionalComponent<IProps> = observer(({ application }) => {

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <div className='flex flex-row items-center'>
          <div className='flex-grow flex flex-col'>
            <Title>Advanced Settings</Title>

            {!application.hasAccount() && (
              <OfflineSubscription application={application} />
            )}
          </div>
        </div>
      </PreferencesSegment>
    </PreferencesGroup>
  );
});
