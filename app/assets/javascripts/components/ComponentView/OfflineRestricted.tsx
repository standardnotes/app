import { FunctionalComponent } from 'preact';

interface IProps {
  isReloading: boolean;
  reloadStatus: () => void;
}

export const OfflineRestricted: FunctionalComponent<IProps> = ({
  isReloading,
  reloadStatus,
}) => {
  return (
    <div className={'sn-component'}>
      <div className={'sk-panel static'}>
        <div className={'sk-panel-content'}>
          <div className={'sk-panel-section stretch'}>
            <div className={'sk-panel-column'} />
            <div className={'sk-h1 sk-bold'}>
              You have restricted this component to be used offline only.
            </div>
            <div className={'sk-subtitle'}>
              Offline components are not available in the web application.
            </div>
            <div className={'sk-panel-row'} />
            <div className={'sk-panel-row'}>
              <div className={'sk-panel-column'}>
                <div className={'sk-p'}>You can either:</div>
                <ul>
                  <li className={'sk-p'}>
                    Enable the Hosted option for this component by opening
                    Preferences {'>'} General {'>'} Advanced Settings menu and{' '}
                    toggling 'Use hosted when local is unavailable' under this
                    components's options. Then press Reload below.
                  </li>
                  <li className={'sk-p'}>Use the desktop application.</li>
                </ul>
              </div>
            </div>
            <div className={'sk-panel-row'}>
              {isReloading ? (
                <div className={'sk-spinner info small'} />
              ) : (
                <button
                  className={'sn-button small info'}
                  onClick={() => reloadStatus()}
                >
                  Reload
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
