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

import { ComponentViewDirective } from '@/components/ComponentView';
import { NavigationDirective } from '@/components/Navigation';
import { PinNoteButtonDirective } from '@/components/PinNoteButton';
import { IsWebPlatform, WebAppVersion } from '@/version';
import {
  ApplicationGroupView,
  ApplicationView,
  ChallengeModal,
  NoteGroupViewDirective,
  NoteViewDirective,
} from '@/views';
import { SNLog } from '@standardnotes/snjs';
import angular from 'angular';
import { AccountMenuDirective } from './components/AccountMenu';
import { ConfirmSignoutDirective } from './components/ConfirmSignoutModal';
import { IconDirective } from './components/Icon';
import { MultipleSelectedNotesDirective } from './components/MultipleSelectedNotes';
import { NoAccountWarningDirective } from './components/NoAccountWarning';
import { NotesContextMenuDirective } from './components/NotesContextMenu';
import { NotesListOptionsDirective } from './components/NotesListOptionsMenu';
import { NotesOptionsPanelDirective } from './components/NotesOptionsPanel';
import { NotesViewDirective } from './components/NotesView';
import { NoteTagsContainerDirective } from './components/NoteTagsContainer';
import { ProtectedNoteOverlayDirective } from './components/ProtectedNoteOverlay';
import { QuickSettingsMenuDirective } from './components/QuickSettingsMenu/QuickSettingsMenu';
import { SearchOptionsDirective } from './components/SearchOptions';
import { SessionsModalDirective } from './components/SessionsModal';
import {
  autofocus,
  clickOutside,
  delayHide,
  elemReady,
  fileChange,
  lowercase,
  selectOnFocus,
  snEnter,
} from './directives/functional';
import {
  InputModal,
  PanelResizer,
  PasswordWizard,
  PermissionsModal,
  RevisionPreviewModal,
} from './directives/views';
import { trusted } from './filters';
import { PreferencesDirective } from './preferences';
import { PurchaseFlowDirective } from './purchaseFlow';
import { configRoutes } from './routes';
import { Bridge } from './services/bridge';
import { BrowserBridge } from './services/browserBridge';
import { startErrorReporting } from './services/errorReporting';
import { StartApplication } from './startApplication';
import { ApplicationGroup } from './ui_models/application_group';
import { isDev } from './utils';
import { AccountSwitcher } from './views/account_switcher/account_switcher';
import { react2angular } from 'react2angular';
import { MenuRow, React2AngularMenuRowPropsArray } from './components/MenuRow';
import { Footer, React2AngularFooterPropsArray } from './components/Footer';
import {
  ActionsMenu,
  React2AngularActionsMenuPropsArray,
} from './components/ActionsMenu';
import {
  HistoryMenu,
  React2AngularHistoryMenuPropsArray,
} from './components/HistoryMenu';

function reloadHiddenFirefoxTab(): boolean {
  /**
   * For Firefox pinned tab issue:
   * When a new browser session is started, and SN is in a pinned tab,
   * SN exhibits strange behavior until the tab is reloaded.
   */
  if (
    document.hidden &&
    navigator.userAgent.toLowerCase().includes('firefox')
  ) {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        location.reload();
      }
    });
    return true;
  } else {
    return false;
  }
}

const startApplication: StartApplication = async function startApplication(
  defaultSyncServerHost: string,
  bridge: Bridge,
  enableUnfinishedFeatures: boolean,
  webSocketUrl: string
) {
  if (reloadHiddenFirefoxTab()) {
    return;
  }

  SNLog.onLog = console.log;
  startErrorReporting();

  angular.module('app', []);

  // Config
  angular
    .module('app')
    .config(configRoutes)
    .constant('bridge', bridge)
    .constant('defaultSyncServerHost', defaultSyncServerHost)
    .constant('appVersion', bridge.appVersion)
    .constant('enableUnfinishedFeatures', enableUnfinishedFeatures)
    .constant('webSocketUrl', webSocketUrl);

  // Controllers
  angular
    .module('app')
    .directive('applicationGroupView', () => new ApplicationGroupView())
    .directive('applicationView', () => new ApplicationView())
    .directive('noteGroupView', () => new NoteGroupViewDirective())
    .directive('noteView', () => new NoteViewDirective());

  // Directives - Functional
  angular
    .module('app')
    .directive('snAutofocus', ['$timeout', autofocus])
    .directive('clickOutside', ['$document', clickOutside])
    .directive('delayHide', delayHide)
    .directive('elemReady', elemReady)
    .directive('fileChange', fileChange)
    .directive('lowercase', lowercase)
    .directive('selectOnFocus', ['$window', selectOnFocus])
    .directive('snEnter', snEnter);

  // Directives - Views
  angular
    .module('app')
    .directive('accountSwitcher', () => new AccountSwitcher())
    .directive('challengeModal', () => new ChallengeModal())
    .directive('componentView', ComponentViewDirective)
    .directive('inputModal', () => new InputModal())
    .component(
      'actionsMenu',
      react2angular(ActionsMenu as never, React2AngularActionsMenuPropsArray)
    )
    .component(
      'menuRow',
      react2angular(MenuRow as never, React2AngularMenuRowPropsArray)
    )
    .component(
      'footer',
      react2angular(Footer as never, React2AngularFooterPropsArray)
    )
    .component(
      'historyMenu',
      react2angular(HistoryMenu as never, React2AngularHistoryMenuPropsArray)
    )
    .directive('panelResizer', () => new PanelResizer())
    .directive('passwordWizard', () => new PasswordWizard())
    .directive('permissionsModal', () => new PermissionsModal())
    .directive('revisionPreviewModal', () => new RevisionPreviewModal())
    .directive('sessionsModal', SessionsModalDirective)
    .directive('accountMenu', AccountMenuDirective)
    .directive('quickSettingsMenu', QuickSettingsMenuDirective)
    .directive('noAccountWarning', NoAccountWarningDirective)
    .directive('protectedNotePanel', ProtectedNoteOverlayDirective)
    .directive('searchOptions', SearchOptionsDirective)
    .directive('confirmSignout', ConfirmSignoutDirective)
    .directive('multipleSelectedNotesPanel', MultipleSelectedNotesDirective)
    .directive('notesContextMenu', NotesContextMenuDirective)
    .directive('notesOptionsPanel', NotesOptionsPanelDirective)
    .directive('notesListOptionsMenu', NotesListOptionsDirective)
    .directive('icon', IconDirective)
    .directive('noteTagsContainer', NoteTagsContainerDirective)
    .directive('navigation', NavigationDirective)
    .directive('preferences', PreferencesDirective)
    .directive('purchaseFlow', PurchaseFlowDirective)
    .directive('notesView', NotesViewDirective)
    .directive('pinNoteButton', PinNoteButtonDirective);

  // Filters
  angular.module('app').filter('trusted', ['$sce', trusted]);

  // Services
  angular.module('app').service('mainApplicationGroup', ApplicationGroup);

  // Debug
  if (isDev) {
    Object.defineProperties(window, {
      application: {
        get: () =>
          (
            angular
              .element(document)
              .injector()
              .get('mainApplicationGroup') as any
          ).primaryApplication,
      },
    });
  }

  angular.element(document).ready(() => {
    angular.bootstrap(document, ['app']);
  });
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
