import { FunctionalComponent } from 'preact';
import { Subtitle } from '@/preferences/components';
import { DecoratedInput } from '@/components/DecoratedInput';
import { Button } from '@/components/Button';
import { JSXInternal } from '@node_modules/preact/src/jsx';
import TargetedEvent = JSXInternal.TargetedEvent;
import { useState } from 'preact/hooks';
import { WebApplication } from '@/ui_models/application';

interface IProps {
  application: WebApplication;
}

export const OfflineSubscription: FunctionalComponent<IProps> = ({ application }) => {
  const [activationCode, setActivationCode] = useState('');
  const [isSuccessfullyActivated, setIsSuccessfullyActivated] = useState(false);

  const handleSubscriptionCodeSubmit = async (event: TargetedEvent<HTMLFormElement, Event>) => {
    event.preventDefault();

    const resultErrorMessage = await application.setOfflineFeatures(activationCode);

    if (resultErrorMessage) {
      await application.alertService.alert(resultErrorMessage);
    } else {
      setIsSuccessfullyActivated(true);
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
              disabled={isSuccessfullyActivated}
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
