import { FunctionalComponent } from 'preact';
import { Subtitle } from '@/preferences/components';
import { DecoratedInput } from '@/components/DecoratedInput';
import { Button } from '@/components/Button';
import { JSXInternal } from '@node_modules/preact/src/jsx';
import TargetedEvent = JSXInternal.TargetedEvent;
import { useEffect, useState } from 'preact/hooks';
import { WebApplication } from '@/ui_models/application';
import { APPLICATION_DEFAULT_HOSTS } from '@Views/constants';
import { AppState } from '@/ui_models/app_state';
import { observer } from 'mobx-react-lite';
import { ConfirmRemoveOfflineKeyContainer } from '@/preferences/components/ConfirmRemoveOfflineKeyModal';

interface IProps {
  application: WebApplication;
  appState: AppState;
}

export const OfflineSubscription: FunctionalComponent<IProps> = observer(({ application, appState }) => {
  const [activationCode, setActivationCode] = useState('');
  const [isSuccessfullyActivated, setIsSuccessfullyActivated] = useState(false);
  const [hasUserPreviouslyStoredCode, setHasUserPreviouslyStoredCode] = useState(false);

  useEffect(() => {
    if (application.getIsOfflineActivationCodeStoredPreviously()) {
      setHasUserPreviouslyStoredCode(true);
    }
  }, [application]);

  const isCustomServerHostUsed = () => {
    try {
      const applicationHost = application.getHost() || '';
      const { host } = new URL(applicationHost);

      return !APPLICATION_DEFAULT_HOSTS.includes(host);
    } catch (err) {
      return false;
    }
  };

  const shouldShowOfflineSubscription = () => {
    return !application.hasAccount() || isCustomServerHostUsed();
  };

  const handleSubscriptionCodeSubmit = async (event: TargetedEvent<HTMLFormElement, Event>) => {
    event.preventDefault();

    const resultErrorMessage = await application.setOfflineFeatures(activationCode);

    if (resultErrorMessage) {
      await application.alertService.alert(resultErrorMessage);
    } else {
      setIsSuccessfullyActivated(true);
    }
  };

  if (!shouldShowOfflineSubscription()) {
    return null;
  }

  return (
    <div className='flex items-center justify-between'>
      <div className='flex flex-col mt-3 w-full'>
        <Subtitle>{!hasUserPreviouslyStoredCode && 'Activate'} Offline Subscription</Subtitle>
        <form onSubmit={handleSubscriptionCodeSubmit}>
          <div className={'mt-2'}>
            {hasUserPreviouslyStoredCode ? (
              <Button
                type='danger'
                label='Remove offline key'
                onClick={() => {
                  appState.preferences.setIsRemovingOfflineKey(true);
                }}
              />
            ) : (
              <DecoratedInput
                onChange={(code) => setActivationCode(code)}
                placeholder={'Offline Subscription Code'}
                text={activationCode}
                disabled={isSuccessfullyActivated}
              />
            )}
          </div>
          {isSuccessfullyActivated && (
            <div className={'mt-3 mb-3 info font-bold'}>Successfully activated!</div>
          )}
          {!hasUserPreviouslyStoredCode && !isSuccessfullyActivated && (
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
      <ConfirmRemoveOfflineKeyContainer appState={appState} />
    </div>
  );
};
