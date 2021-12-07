import { FeatureStatus } from '@standardnotes/snjs';
import { FunctionalComponent } from 'preact';

interface IProps {
  expiredDate: string;
  componentName: string;
  featureStatus: FeatureStatus;
  reloadStatus: () => void;
  manageSubscription: () => void;
}

const statusString = (featureStatus: FeatureStatus, expiredDate: string, componentName: string) => {
  switch (featureStatus) {
    case FeatureStatus.InCurrentPlanButExpired:
      return `Your subscription expired on ${expiredDate}`;
    case FeatureStatus.NoUserSubscription:
      return `You do not have an active subscription`;
    case FeatureStatus.NotInCurrentPlan:
      return `Please upgrade your plan to access ${componentName}`;
    default:
      return `${componentName} is valid and you should not be seeing this message`;
  }
};

export const IsExpired: FunctionalComponent<IProps> = ({
  expiredDate,
  featureStatus,
  reloadStatus,
  componentName,
  manageSubscription
}) => {
  return (
    <div className={'sn-component'}>
      <div className={'sk-app-bar no-edges no-top-edge dynamic-height'}>
        <div className={'left'}>
          <div className={'sk-app-bar-item'}>
            <div className={'sk-app-bar-item-column'}>
              <div className={'sk-circle danger small'} />
            </div>
            <div className={'sk-app-bar-item-column'}>
              <div>
                <strong>
                  {statusString(featureStatus, expiredDate, componentName)}
                </strong>
                <div className={'sk-p'}>
                  {componentName} is in a read-only state.
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className={'right'}>
          <div className={'sk-app-bar-item'} onClick={() => manageSubscription()}>
            <button className={'sn-button small success'}>Manage Subscription</button>
          </div>
          <div className={'sk-app-bar-item'} onClick={() => reloadStatus()}>
            <button className={'sn-button small info'}>Reload</button>
          </div>
        </div>
      </div>
    </div>
  );
};
