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
  }
}

import { SNLog } from '@standardnotes/snjs';
import angular from 'angular';
import { configRoutes } from './routes';

import { ApplicationGroup } from './ui_models/application_group';
import { AccountSwitcher } from './views/account_switcher/account_switcher';

import {
  ApplicationGroupView,
  ApplicationView,
  EditorGroupView,
  EditorView,
  TagsView,
  NotesView,
  FooterView,
  ChallengeModal,
} from '@/views';

import {
  autofocus,
  clickOutside,
  delayHide,
  elemReady,
  fileChange,
  infiniteScroll,
  lowercase,
  selectOnFocus,
  snEnter,
} from './directives/functional';

import {
  ActionsMenu,
  ComponentModal,
  EditorMenu,
  InputModal,
  MenuRow,
  PanelResizer,
  PasswordWizard,
  PermissionsModal,
  RevisionPreviewModal,
  HistoryMenu,
  SyncResolutionMenu,
} from './directives/views';

import { trusted } from './filters';
import { isDev } from './utils';
import { BrowserBridge } from './services/browserBridge';
import { startErrorReporting } from './services/errorReporting';
import { StartApplication } from './startApplication';
import { Bridge } from './services/bridge';
import { SessionsModalDirective } from './components/SessionsModal';
import { NoAccountWarningDirective } from './components/NoAccountWarning';
import { NoProtectionsdNoteWarningDirective } from './components/NoProtectionsNoteWarning';
import { SearchOptionsDirective } from './components/SearchOptions';
import { AccountMenuDirective } from './components/AccountMenu';
import { ConfirmSignoutDirective } from './components/ConfirmSignoutModal';
import { MultipleSelectedNotesDirective } from './components/MultipleSelectedNotes';
import { NotesContextMenuDirective } from './components/NotesContextMenu';
import { NotesOptionsPanelDirective } from './components/NotesOptionsPanel';
import { IconDirective } from './components/Icon';
import { NoteTagsContainerDirective } from './components/NoteTagsContainer';
import { PreferencesDirective } from './preferences';
import { AppVersion, IsWebPlatform } from '@/version';
import { NotesListOptionsDirective } from './components/NotesListOptionsMenu';
import { PurchaseFlowDirective } from './purchaseFlow';
import { QuickSettingsMenuDirective } from './components/QuickSettingsMenu/QuickSettingsMenu';
import { ComponentViewDirective } from '@/components/ComponentView';
import { TagsListDirective } from '@/components/TagsList';
import { PinNoteButtonDirective } from '@/components/PinNoteButton';

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

  angular.module('app', ['ngSanitize']);

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
    .directive('editorGroupView', () => new EditorGroupView())
    .directive('editorView', () => new EditorView())
    .directive('tagsView', () => new TagsView())
    .directive('notesView', () => new NotesView())
    .directive('footerView', () => new FooterView());

  // Directives - Functional
  angular
    .module('app')
    .directive('snAutofocus', ['$timeout', autofocus])
    .directive('clickOutside', ['$document', clickOutside])
    .directive('delayHide', delayHide)
    .directive('elemReady', elemReady)
    .directive('fileChange', fileChange)
    .directive('infiniteScroll', [infiniteScroll])
    .directive('lowercase', lowercase)
    .directive('selectOnFocus', ['$window', selectOnFocus])
    .directive('snEnter', snEnter);

  // Directives - Views
  angular
    .module('app')
    .directive('accountSwitcher', () => new AccountSwitcher())
    .directive('actionsMenu', () => new ActionsMenu())
    .directive('challengeModal', () => new ChallengeModal())
    .directive('componentModal', () => new ComponentModal())
    .directive('componentView', ComponentViewDirective)
    .directive('editorMenu', () => new EditorMenu())
    .directive('inputModal', () => new InputModal())
    .directive('menuRow', () => new MenuRow())
    .directive('panelResizer', () => new PanelResizer())
    .directive('passwordWizard', () => new PasswordWizard())
    .directive('permissionsModal', () => new PermissionsModal())
    .directive('revisionPreviewModal', () => new RevisionPreviewModal())
    .directive('historyMenu', () => new HistoryMenu())
    .directive('syncResolutionMenu', () => new SyncResolutionMenu())
    .directive('sessionsModal', SessionsModalDirective)
    .directive('accountMenu', AccountMenuDirective)
    .directive('quickSettingsMenu', QuickSettingsMenuDirective)
    .directive('noAccountWarning', NoAccountWarningDirective)
    .directive('protectedNotePanel', NoProtectionsdNoteWarningDirective)
    .directive('searchOptions', SearchOptionsDirective)
    .directive('confirmSignout', ConfirmSignoutDirective)
    .directive('multipleSelectedNotesPanel', MultipleSelectedNotesDirective)
    .directive('notesContextMenu', NotesContextMenuDirective)
    .directive('notesOptionsPanel', NotesOptionsPanelDirective)
    .directive('notesListOptionsMenu', NotesListOptionsDirective)
    .directive('icon', IconDirective)
    .directive('noteTagsContainer', NoteTagsContainerDirective)
    .directive('tags', TagsListDirective)
    .directive('preferences', PreferencesDirective)
    .directive('purchaseFlow', PurchaseFlowDirective)
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
    (window as any)._default_sync_server as string,
    new BrowserBridge(AppVersion),
    (window as any)._enable_unfinished_features as boolean,
    (window as any)._websocket_url as string
  );
} else {
  (window as any).startApplication = startApplication;
}
