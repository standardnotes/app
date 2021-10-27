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
  const [isSuccessfullyActivated, setIsSuccessfullyActivated] = useState(false);

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

    const errorMessage = 'There was a problem with offline activation. Please try again.'; // TODO: better message here?

    try {
      const activationCodeWithoutSpaces = activationCode.replace(/\s/g, '');
      const decodedData = await base64Decode(activationCodeWithoutSpaces);

      const { featuresUrl, extensionKey } = getOfflineSubscriptionDetails(decodedData);

      if (!featuresUrl || !extensionKey) {
        await application.alertService.alert(errorMessage);
        return;
      }

      await application.setValue(STORAGE_KEY_OFFLINE_SUBSCRIPTION, decodedData);

      const result = await application.getAndStoreOfflineFeatures(featuresUrl, extensionKey);

      if (!result) {
        await application.alertService.alert(errorMessage);
      }

      setIsSuccessfullyActivated(true);

    } catch (err) {
      await application.alertService.alert(errorMessage);
    }
  };

  return (
    <div className='flex items-center justify-between'>
      <div className='flex flex-col mt-3 w-full'>
        <Subtitle>Activate Offline Subscription</Subtitle>
        <form onSubmit={handleSubscriptionCodeSubmit}>
          <div className={'mt-2'}>
            <DecoratedInput
              onChange={(code) => setActivationCode(code)}
              placeholder={'Offline Subscription Code'}
              text={activationCode}
            />
          </div>
          {isSuccessfullyActivated ? (
              <div className={'mt-3 mb-3 info font-bold'}>Successfully activated!</div> /* TODO: better UI/text? */
            )
            : (
              <Button
                className='mt-3 mb-3'
                label={'Submit'}
                type='primary'
                disabled={activationCode === ''}
                onClick={(event) =>
                  handleSubscriptionCodeSubmit(event as TargetedEvent<HTMLFormElement>)
                }
              />
            )}
        </form>
      </div>
    </div>
  );
};
