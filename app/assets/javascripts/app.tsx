'use strict';

declare global {
  interface Window {
    bugsnagApiKey?: string;
    dashboardUrl?: string;
    defaultSyncServer: string;
    devAccountEmail?: string;
    devAccountPassword?: string;
    devAccountServer?: string;
    enabledUnfinishedFeatures: boolean;
    plansUrl?: string;
    purchaseUrl?: string;
    startApplication?: StartApplication;
    websocketUrl: string;
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
    window.defaultSyncServer,
    new BrowserBridge(WebAppVersion),
    window.enabledUnfinishedFeatures,
    window.websocketUrl
  );
} else {
  window.startApplication = startApplication;
}
