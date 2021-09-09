import { PreferencesGroup, PreferencesSegment, Text, Title } from '@/preferences/components';
import { Button } from '@/components/Button';
import { WebApplication } from '@/ui_models/application';
import { observer } from '@node_modules/mobx-react-lite';
import { HorizontalSeparator } from '@/components/shared/HorizontalSeparator';
import { dateToLocalizedString } from '@/utils';
import { useState } from 'preact/hooks';
import { ChangeEmail } from '@/preferences/panes/account/ChangeEmail';
import { ChangePassword } from '@/preferences/panes/account/changePassword';

type Props = {
  application: WebApplication;
};

export const Credentials = observer(({ application }: Props) => {
  const [isChangePasswordDialogOpen, setIsChangePasswordDialogOpen] = useState(false);
  const [isChangeEmailDialogOpen, setIsChangeEmailDialogOpen] = useState(false);

  const user = application.getUser();

  const passwordCreatedAtTimestamp = application.getUserPasswordCreationDate() as Date;
  const passwordCreatedOn = dateToLocalizedString(passwordCreatedAtTimestamp);

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <Title>Credentials</Title>
        <div className={'text-input mt-2'}>
          Email
        </div>
        <Text>
          You're signed in as <span className='font-bold'>{user?.email}</span>
        </Text>
        <Button
          className='min-w-20 mt-3'
          type='normal'
          label='Change email'
          onClick={() => {
            setIsChangeEmailDialogOpen(true);
          }}
        />
        <HorizontalSeparator classes='mt-5 mb-3' />
        <div className={'text-input mt-2'}>
          Password
        </div>
        <Text>
          Current password was set on <span className='font-bold'>{passwordCreatedOn}</span>
        </Text>
        <Button
          className='min-w-20 mt-3'
          type='normal'
          label='Change password'
          onClick={() => {
            setIsChangePasswordDialogOpen(true);
          }}
        />
        {isChangeEmailDialogOpen && (
          <ChangeEmail
            onCloseDialog={() => setIsChangeEmailDialogOpen(false)}
            snAlert={application.alertService.alert}
          />
        )}
        {
          isChangePasswordDialogOpen && (
            <ChangePassword
              onCloseDialog={() => setIsChangePasswordDialogOpen(false)}
              application={application}
            />
          )}
      </PreferencesSegment>
    </PreferencesGroup>
  );
});
