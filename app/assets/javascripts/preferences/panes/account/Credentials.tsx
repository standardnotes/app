import { PreferencesGroup, PreferencesSegment, Text, Title } from '@/preferences/components';
import { Button } from '@/components/Button';
import { WebApplication } from '@/ui_models/application';
import { observer } from '@node_modules/mobx-react-lite';
import PreferencesHorizontalSeparator from '@/components/shared/PreferencesHorizontalSeparator';
import { dateToLocalizedString } from '@/utils';

type Props = {
  application: WebApplication;
};

const Credentials = observer(({ application }: Props) => {
  const user = application.getUser();

  const passwordCreatedAtTimestamp = application.getUserPasswordCreationDate() as number;
  const passwordCreatedOn = dateToLocalizedString(new Date(passwordCreatedAtTimestamp));

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <Title>Credentials</Title>
        <div className={'preferences-segment__title mt-2'}>
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
            throw new Error('Not implemented');
          }}
        />
        <PreferencesHorizontalSeparator classes='mt-5 mb-3' />
        <div className={'preferences-segment__title mt-2'}>
          Password
        </div>
        <Text>
          Current password was created on <span className='font-bold'>{passwordCreatedOn}</span>
        </Text>
        <Button
          className='min-w-20 mt-3'
          type='normal'
          label='Change password'
          onClick={() => {
            throw new Error('Not implemented');
          }}
        />
      </PreferencesSegment>
    </PreferencesGroup>
  );
});

export default Credentials;
