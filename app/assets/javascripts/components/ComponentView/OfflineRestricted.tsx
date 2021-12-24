import { FunctionalComponent } from 'preact';

export const OfflineRestricted: FunctionalComponent = () => {
  return (
    <div className={'sn-component'}>
      <div className={'sk-panel static'}>
        <div className={'sk-panel-content'}>
          <div className={'sk-panel-section stretch'}>
            <div className={'sk-panel-column'} />
            <div className={'sk-h1 sk-bold'}>
              You have restricted this component to not use a hosted version.
            </div>
            <div className={'sk-subtitle'}>
              Locally-installed components are not available in the web
              application.
            </div>
            <div className={'sk-panel-row'} />
            <div className={'sk-panel-row'}>
              <div className={'sk-panel-column'}>
                <div className={'sk-p'}>
                  To continue, choose from the following options:
                </div>
                <ul>
                  <li className={'sk-p'}>
                    Enable the Hosted option for this component by opening the
                    Preferences {'>'} General {'>'} Advanced Settings menu and{' '}
                    toggling 'Use hosted when local is unavailable' under this
                    component's options. Then press Reload.
                  </li>
                  <li className={'sk-p'}>Use the desktop application.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
