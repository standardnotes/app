import { PreferencesGroup, PreferencesSegment, Text, Title } from '@/preferences/components';
import { Button } from '@/components/Button';
import { SyncQueueStrategy } from '@node_modules/@standardnotes/snjs';
import { STRING_GENERIC_SYNC_ERROR } from '@/strings';
import { useState } from '@node_modules/preact/hooks';
import { dateToLocalizedString } from '@/utils';
import { observer } from '@node_modules/mobx-react-lite';
import { WebApplication } from '@/ui_models/application';

type Props = {
  application: WebApplication;
};

export const Sync = observer(({ application }: Props) => {
  const formatLastSyncDate = (lastUpdatedDate: Date) => {
    return dateToLocalizedString(lastUpdatedDate);
  };

  const [isSyncingInProgress, setIsSyncingInProgress] = useState(false);
  const [lastSyncDate, setLastSyncDate] = useState(formatLastSyncDate(application.getLastSyncDate() as Date));

  const doSynchronization = async () => {
    setIsSyncingInProgress(true);

    const response = await application.sync({
      queueStrategy: SyncQueueStrategy.ForceSpawnNew,
      checkIntegrity: true
    });
    setIsSyncingInProgress(false);
    if (response && response.error) {
      application.alertService!.alert(STRING_GENERIC_SYNC_ERROR);
    } else {
      setLastSyncDate(formatLastSyncDate(application.getLastSyncDate() as Date));
    }
  };

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <div className='flex flex-row items-center'>
          <div className='flex-grow flex flex-col'>
            <Title>Sync</Title>
            <Text>
              Last synced <span className='font-bold'>on {lastSyncDate}</span>
            </Text>
            <Button
              className='min-w-20 mt-3'
              type='normal'
              label='Sync now'
              disabled={isSyncingInProgress}
              onClick={doSynchronization}
            />
          </div>
        </div>
      </PreferencesSegment>
    </PreferencesGroup>
  );
});
