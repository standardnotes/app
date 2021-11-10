import { FunctionalComponent } from 'preact';
import { PreferencesGroup, PreferencesSegment, Title } from '@/preferences/components';
import { OfflineSubscription } from '@/preferences/panes/account/offlineSubscription';
import { WebApplication } from '@/ui_models/application';
import { observer } from 'mobx-react-lite';
import { AppState } from '@/ui_models/app_state';
import { Extensions } from '@/preferences/panes/Extensions';
import { ExtensionsLatestVersions } from '@/preferences/panes/extensions-segments';
import { HorizontalSeparator } from '@/components/shared/HorizontalSeparator';
import { AccordionItem } from '@/components/shared/AccordionItem';

interface IProps {
  application: WebApplication;
  appState: AppState;
  extensionsLatestVersions: ExtensionsLatestVersions;
}

export const Advanced: FunctionalComponent<IProps> = observer(
  ({ application, appState, extensionsLatestVersions }) => {
    return (
      <PreferencesGroup>
        <PreferencesSegment>
          <AccordionItem title={'Advanced Settings'}>
            <div className='flex flex-row items-center'>
              <div className='flex-grow flex flex-col'>
                <OfflineSubscription application={application} appState={appState} />
                <HorizontalSeparator classes="mt-8 mb-8" />
                <Extensions application={application} extensionsLatestVersions={extensionsLatestVersions} />
              </div>
            </div>
          </AccordionItem>
        </PreferencesSegment>
      </PreferencesGroup>
    );
  }
);
