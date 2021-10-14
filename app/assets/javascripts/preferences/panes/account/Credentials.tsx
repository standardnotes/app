import { PreferencesGroup, PreferencesSegment, Text, Title } from '@/preferences/components';
import { Button } from '@/components/Button';
import { WebApplication } from '@/ui_models/application';
import { observer } from '@node_modules/mobx-react-lite';
import { HorizontalSeparator } from '@/components/shared/HorizontalSeparator';
import { dateToLocalizedString } from '@/utils';
import { useState } from 'preact/hooks';
import { ChangeEmail } from '@/preferences/panes/account/changeEmail';
import { PasswordWizardType } from '@/types';
import { FunctionComponent } from 'preact';
import { AppState } from '@/ui_models/app_state';

type Props = {
  application: WebApplication;
  appState: AppState;
};

export const Credentials: FunctionComponent<Props> = observer(({ application, appState }: Props) => {
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
        {appState.enableUnfinishedFeatures && (
          <Button
            className='min-w-20 mt-3'
            type='normal'
            label='Change email'
            onClick={() => {
              setIsChangeEmailDialogOpen(true);
            }}
          />
        )}
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
            application.presentPasswordWizard(PasswordWizardType.ChangePassword);
          }}
        />
        {isChangeEmailDialogOpen && (
          <ChangeEmail
            onCloseDialog={() => setIsChangeEmailDialogOpen(false)}
            application={application}
          />
        )}
      </PreferencesSegment>
    </PreferencesGroup>
  );
});
