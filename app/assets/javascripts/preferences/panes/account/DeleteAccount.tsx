import { PreferencesGroup, PreferencesSegment, Text, Title } from '@/preferences/components';
import { Button } from '@/components/Button';
import { useState } from 'preact/hooks';
import { DeleteAccountDialog } from '@/preferences/panes/account/deleteAccountDialog';
import { observer } from '@node_modules/mobx-react-lite';
import { WebApplication } from '@/ui_models/application';

type Props = {
  application: WebApplication;
};

export const DeleteAccount = observer(({ application }: Props) => {
  const [isDeleteAccountDialogOpen, setIsDeleteAccountDialogOpen] = useState(false);

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <div className='flex flex-row items-center'>
          <div className='flex-grow flex flex-col'>
            <Title>Delete account</Title>
            <Text>
              This action is irreversible. This will also delete all local items and preferences.
            </Text>
            <Button
              className='min-w-20 mt-3 color-danger'
              type='normal'
              label='Delete my account for good'
              onClick={() => {setIsDeleteAccountDialogOpen(true);}}
            />
          </div>
        </div>
        {isDeleteAccountDialogOpen && (
          <DeleteAccountDialog
            onCloseDialog={() => setIsDeleteAccountDialogOpen(false)}
            snAlert={application.alertService.alert}
          />
        )}
      </PreferencesSegment>
    </PreferencesGroup>
  );
});
