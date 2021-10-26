import { FunctionalComponent } from 'preact';
import { Subtitle } from '@/preferences/components';
import { DecoratedInput } from '@/components/DecoratedInput';
import { Button } from '@/components/Button';
import { JSXInternal } from '@node_modules/preact/src/jsx';
import TargetedEvent = JSXInternal.TargetedEvent;
import { useState } from 'preact/hooks';
import { base64Decode } from '@node_modules/@standardnotes/sncrypto-web';
import { WebApplication } from '@/ui_models/application';

interface IProps {
  application: WebApplication;
}

const STORAGE_KEY_OFFLINE_SUBSCRIPTION = 'offlineSubscriptionData';

export const OfflineSubscription: FunctionalComponent<IProps> = ({ application }) => {
  const [activationCode, setActivationCode] = useState('');

  const getOfflineSubscriptionDetails = (decodedOfflineSubscriptionToken: string) => {
    try {
      const { featuresUrl, extensionKey } = JSON.parse(decodedOfflineSubscriptionToken);

      return {
        featuresUrl,
        extensionKey
      };
    } catch (error) {
      return {
        featuresUrl: '',
        extensionKey: ''
      };
    }
  };

  const handleSubscriptionCodeSubmit = async (event: TargetedEvent<HTMLFormElement, Event>) => {
    event.preventDefault();

    try {
      const activationCodeWithoutSpaces = activationCode.replace(/\s/g, '');
      const decodedData = await base64Decode(activationCodeWithoutSpaces);

      const { featuresUrl, extensionKey } = getOfflineSubscriptionDetails(decodedData);

      if (!featuresUrl || !extensionKey) {
        // TODO: show error message to user
        return;
      }

      await application.setValue(STORAGE_KEY_OFFLINE_SUBSCRIPTION, decodedData);

      const result = await application.getAndStoreOfflineFeatures(featuresUrl, extensionKey);
      if (!result) {
        // TODO: show error message to user
      }
    } catch (err) {
      // TODO: show error message to user
      console.log(err);
    }
  };

  return (
    <div className='flex items-center justify-between'>
      <div className='flex flex-col mt-3'>
        <Subtitle>Activate Offline Subscription</Subtitle>
        <form onSubmit={handleSubscriptionCodeSubmit}>
          <div className={'mt-2'}>
            <DecoratedInput
              onChange={(code) => setActivationCode(code)}
              placeholder={'Offline Subscription Code'}
              text={activationCode}
            />
          </div>
          <Button
            className='mt-3 mb-3'
            label={'Submit'}
            type='primary'
            disabled={activationCode === ''}
            onClick={(event) =>
              handleSubscriptionCodeSubmit(event as TargetedEvent<HTMLFormElement>)
            }
          />
        </form>
      </div>
    </div>
  );
};
