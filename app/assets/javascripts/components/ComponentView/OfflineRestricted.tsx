import { FunctionalComponent } from 'preact';

interface IProps {
  isReloading: boolean;
  reloadStatus: () => void;
}

export const OfflineRestricted: FunctionalComponent<IProps> = ({
    isReloading,
    reloadStatus
  }) => {
  return (
    <div className={'sn-component'}>
      <div className={'sk-panel static'}>
        <div className={'sk-panel-content'}>
          <div className={'sk-panel-section stretch'}>
            <div className={'sk-panel-column'} />
            <div className={'sk-h1 sk-bold'}>
              You have restricted this extension to be used offline only.
            </div>
            <div className={'sk-subtitle'}>
              Offline extensions are not available in the Web app.
            </div>
            <div className={'sk-panel-row'} />
            <div className={'sk-panel-row'}>
              <div className={'sk-panel-column'}>
                <div className={'sk-p'}>
                  You can either:
                </div>
                <ul>
                  <li className={'sk-p'}>
                          <span className={'font-bold'}>
                            Enable the Hosted option for this extension by opening the 'Extensions' menu and{' '}
                            toggling 'Use hosted when local is unavailable' under this extension's options.{' '}
                            Then press Reload below.
                          </span>
                  </li>
                  <li className={'sk-p'}>
                    <span className={'font-bold'}>Use the Desktop application.</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className={'sk-panel-row'}>
              {isReloading ?
                <div className={'sk-spinner info small'} />
                :
                <button className={'sn-button small info'} onClick={() => reloadStatus()}>
                  Reload
                </button>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
