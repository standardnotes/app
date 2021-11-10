import { FunctionalComponent } from 'preact';

interface IProps {
  expiredDate: string;
  reloadStatus: () => void;
}

export const IsExpired: FunctionalComponent<IProps> = ({
                                                         expiredDate,
                                                         reloadStatus
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
                <a
                  className={'sk-label sk-base'}
                  href={'https://dashboard.standardnotes.com'}
                  rel={'noopener'}
                  target={'_blank'}
                >
                  Your Extended subscription expired on {expiredDate}
                </a>
                <div className={'sk-p'}>
                  Extensions are in a read-only state.
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className={'right'}>
          <div className={'sk-app-bar-item'} onClick={() => reloadStatus()}>
            <button className={'sn-button small info'}>Reload</button>
          </div>
          <div className={'sk-app-bar-item'}>
            <div className={'sk-app-bar-item-column'}>
              <a
                className={'sn-button small warning'}
                href={'https://standardnotes.com/help/41/my-extensions-appear-as-expired-even-though-my-subscription-is-still-valid'}
                rel={'noopener'}
                target={'_blank'}
              >
                Help
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
