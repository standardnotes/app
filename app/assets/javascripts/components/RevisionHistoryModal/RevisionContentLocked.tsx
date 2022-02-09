import { SubscriptionName } from '@standardnotes/auth';
import { FunctionComponent } from 'preact';
import HistoryLockedIllustration from '../../../svg/il-history-locked.svg';
import { Button } from '../Button';

const PLAN_HISTORY_DURATION: { [key in SubscriptionName]: string } = {
  CORE_PLAN: '30 days',
  PLUS_PLAN: '365 days',
  PRO_PLAN: 'Unlimited',
};

const getPlanShortName = (planId: SubscriptionName | undefined) => {
  switch (planId) {
    case 'CORE_PLAN':
      return 'Core';
    case 'PLUS_PLAN':
      return 'Plus';
    case 'PRO_PLAN':
      return 'Pro';
    default:
      return 'Free';
  }
};

export const RevisionContentLocked: FunctionComponent<{
  planId: SubscriptionName | undefined;
}> = ({ planId }) => (
  <div className="flex w-full h-full items-center justify-center">
    <div className="flex flex-col items-center text-center max-w-40%">
      <HistoryLockedIllustration />
      <div class="text-lg color-black font-bold mt-2 mb-1">
        Can't access this version
      </div>
      <div className="mb-4 color-grey-0 leading-140%">
        Version history is limited to{' '}
        {planId ? PLAN_HISTORY_DURATION[planId] : 'the current session'} in the{' '}
        {getPlanShortName(planId)} plan. Check out our other plans for more
        details.
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
