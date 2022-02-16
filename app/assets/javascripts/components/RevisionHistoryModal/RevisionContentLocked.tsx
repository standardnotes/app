import { AppState } from '@/ui_models/app_state';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import HistoryLockedIllustration from '../../../svg/il-history-locked.svg';
import { Button } from '../Button';

const getPlanHistoryDuration = (planName: string | undefined) => {
  switch (planName) {
    case 'Core':
      return '30 days';
    case 'Plus':
      return '365 days';
    default:
      return "the current session's changes";
  }
};

const getPremiumContentCopy = (planName: string | undefined) => {
  return `Version history is limited to ${getPlanHistoryDuration(
    planName
  )} in the ${planName} plan`;
};

export const RevisionContentLocked: FunctionComponent<{
  appState: AppState;
}> = observer(({ appState }) => {
  const {
    userSubscriptionName,
    isUserSubscriptionExpired,
    isUserSubscriptionCanceled,
  } = appState.subscription;

  return (
    <div className="flex w-full h-full items-center justify-center">
      <div className="flex flex-col items-center text-center max-w-40%">
        <HistoryLockedIllustration />
        <div class="text-lg font-bold mt-2 mb-1">Can't access this version</div>
        <div className="mb-4 color-grey-0 leading-140%">
          {getPremiumContentCopy(
            !isUserSubscriptionCanceled &&
              !isUserSubscriptionExpired &&
              userSubscriptionName
              ? userSubscriptionName
              : 'free'
          )}
          . Learn more about our other plans to upgrade your history capacity.
        </div>
        <Button
          type="primary"
          label="Discover plans"
          onClick={() => {
            if (window._plans_url) {
              window.location.assign(window._plans_url);
            }
          }}
        />
      </div>
    </div>
  );
});
