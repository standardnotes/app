import { FunctionalComponent } from 'preact';
import { Subtitle } from '@/preferences/components';
import { DecoratedInput } from '@/components/DecoratedInput';
import { Button } from '@/components/Button';
import { JSXInternal } from '@node_modules/preact/src/jsx';
import TargetedEvent = JSXInternal.TargetedEvent;
import { useEffect, useState } from 'preact/hooks';
import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
import { observer } from 'mobx-react-lite';
import { STRING_REMOVE_OFFLINE_KEY_CONFIRMATION } from '@/strings';
import { ButtonType } from '@standardnotes/snjs';

interface IProps {
  application: WebApplication;
  appState: AppState;
}

export const OfflineSubscription: FunctionalComponent<IProps> = observer(({ application, appState }) => {
  const [activationCode, setActivationCode] = useState('');
  const [isSuccessfullyActivated, setIsSuccessfullyActivated] = useState(false);
  const [isSuccessfullyRemoved, setIsSuccessfullyRemoved] = useState(false);
  const [hasUserPreviouslyStoredCode, setHasUserPreviouslyStoredCode] = useState(false);

  useEffect(() => {
    if (application.getIsOfflineActivationCodeStoredPreviously()) {
      setHasUserPreviouslyStoredCode(true);
    }
  }, [application]);

  const shouldShowOfflineSubscription = () => {
    return !application.hasAccount() || application.isCustomServerHostUsed();
  };

  const handleSubscriptionCodeSubmit = async (event: TargetedEvent<HTMLFormElement, Event>) => {
    event.preventDefault();

    const result = await application.setOfflineFeatures(activationCode);

    if (result?.error) {
      await application.alertService.alert(result.error);
    } else {
      setIsSuccessfullyActivated(true);
      setHasUserPreviouslyStoredCode(true);
      setIsSuccessfullyRemoved(false);
    }
  };

  const handleRemoveOfflineKey = async () => {
    await application.removeOfflineActivationCode();

    setIsSuccessfullyActivated(false);
    setHasUserPreviouslyStoredCode(false);
    setActivationCode('');
    setIsSuccessfullyRemoved(true);
  };

  if (!shouldShowOfflineSubscription()) {
    return null;
  }

  const handleRemoveClick = async () => {
    application.alertService.confirm(
      STRING_REMOVE_OFFLINE_KEY_CONFIRMATION,
      'Remove offline key?',
      'Remove Offline Key',
      ButtonType.Danger,
      'Cancel'
    )
      .then(async (shouldRemove: boolean) => {
        if (shouldRemove) {
          await handleRemoveOfflineKey();
        }
      })
      .catch((err: string) => {
        application.alertService.alert(err);
      });
  };

  return (
    <div className='flex items-center justify-between'>
      <div className='flex flex-col mt-3 w-full'>
        <Subtitle>{!hasUserPreviouslyStoredCode && 'Activate'} Offline Subscription</Subtitle>
        <form onSubmit={handleSubscriptionCodeSubmit}>
          <div className={'mt-2'}>
            {!hasUserPreviouslyStoredCode && (
              <DecoratedInput
                onChange={(code) => setActivationCode(code)}
                placeholder={'Offline Subscription Code'}
                text={activationCode}
                disabled={isSuccessfullyActivated}
                className={'mb-3'}
              />
            )}
          </div>
          {(isSuccessfullyActivated || isSuccessfullyRemoved) && (
            <div className={'mt-3 mb-3 info font-bold'}>
              Successfully {isSuccessfullyActivated ? 'Activated' : 'Removed'}!
            </div>
          )}
          {hasUserPreviouslyStoredCode && (
            <Button
              type='danger'
              label='Remove offline key'
              onClick={() => {
                handleRemoveClick();
              }}
            />
          )}
          {!hasUserPreviouslyStoredCode && !isSuccessfullyActivated && (
            <Button
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
});
