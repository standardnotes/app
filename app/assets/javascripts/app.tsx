'use strict';

declare global {
  interface Window {
    // eslint-disable-next-line camelcase
    _bugsnag_api_key?: string;
    // eslint-disable-next-line camelcase
    _purchase_url?: string;
    // eslint-disable-next-line camelcase
    _plans_url?: string;
    // eslint-disable-next-line camelcase
    _dashboard_url?: string;
    // eslint-disable-next-line camelcase
    _default_sync_server: string;
    // eslint-disable-next-line camelcase
    _enable_unfinished_features: boolean;
    // eslint-disable-next-line camelcase
    _websocket_url: string;
    startApplication?: StartApplication;

    _devAccountEmail?: string;
    _devAccountPassword?: string;
    _devAccountServer?: string;
  }
}

import { IsWebPlatform, WebAppVersion } from '@/version';
import { Runtime, SNLog } from '@standardnotes/snjs';
import { render } from 'preact';
import { ApplicationGroupView } from './components/ApplicationGroupView';
import { Bridge } from './services/bridge';
import { BrowserBridge } from './services/browserBridge';
import { startErrorReporting } from './services/errorReporting';
import { StartApplication } from './startApplication';
import { ApplicationGroup } from './ui_models/application_group';
import { isDev } from './utils';

const startApplication: StartApplication = async function startApplication(
  defaultSyncServerHost: string,
  bridge: Bridge,
  enableUnfinishedFeatures: boolean,
  webSocketUrl: string
) {
  SNLog.onLog = console.log;
  startErrorReporting();

  const mainApplicationGroup = new ApplicationGroup(
    defaultSyncServerHost,
    bridge,
    enableUnfinishedFeatures ? Runtime.Dev : Runtime.Prod,
    webSocketUrl
  );

  if (isDev) {
    Object.defineProperties(window, {
      application: {
        get: () => mainApplicationGroup.primaryApplication,
      },
    });
  }

  const renderApp = () => {
    render(
      <ApplicationGroupView mainApplicationGroup={mainApplicationGroup} />,
      document.body.appendChild(document.createElement('div'))
    );
  };

  const domReady =
    document.readyState === 'complete' || document.readyState === 'interactive';
  if (domReady) {
    renderApp();
  } else {
    window.addEventListener('DOMContentLoaded', () => {
      renderApp();
    });
  }
};

if (IsWebPlatform) {
  startApplication(
    window._default_sync_server,
    new BrowserBridge(WebAppVersion),
    window._enable_unfinished_features,
    window._websocket_url
  );
} else {
  window.startApplication = startApplication;
}
