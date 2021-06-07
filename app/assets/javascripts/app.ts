'use strict';

declare const __VERSION__: string;
declare const __WEB__: boolean;

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
  AccountMenu,
  ActionsMenu,
  ComponentModal,
  ComponentView,
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
import { ConfirmSignoutDirective } from './components/ConfirmSignoutModal';
import { MultipleSelectedNotesDirective } from './components/MultipleSelectedNotes';
import { NotesContextMenuDirective } from './components/NotesContextMenu';
import { NotesOptionsPanelDirective } from './components/NotesOptionsPanel';
import { IconDirective } from './components/Icon';
import { NoteTagsContainerDirective } from './components/NoteTagsContainer';

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
  nextVersionSyncServerHost: string,
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
    .constant('nextVersionSyncServerHost', nextVersionSyncServerHost)
    .constant('appVersion', bridge.appVersion);

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
    .directive('accountMenu', () => new AccountMenu())
    .directive('accountSwitcher', () => new AccountSwitcher())
    .directive('actionsMenu', () => new ActionsMenu())
    .directive('challengeModal', () => new ChallengeModal())
    .directive('componentModal', () => new ComponentModal())
    .directive('componentView', () => new ComponentView())
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
    .directive('noAccountWarning', NoAccountWarningDirective)
    .directive('protectedNotePanel', NoProtectionsdNoteWarningDirective)
    .directive('searchOptions', SearchOptionsDirective)
    .directive('confirmSignout', ConfirmSignoutDirective)
    .directive('multipleSelectedNotesPanel', MultipleSelectedNotesDirective)
    .directive('notesContextMenu', NotesContextMenuDirective)
    .directive('notesOptionsPanel', NotesOptionsPanelDirective)
    .directive('icon', IconDirective)
    .directive('noteTagsContainer', NoteTagsContainerDirective);

  // Filters
  angular.module('app').filter('trusted', ['$sce', trusted]);

  // Services
  angular.module('app').service('mainApplicationGroup', ApplicationGroup);

  // Debug
  if (isDev) {
    Object.defineProperties(window, {
      application: {
        get: () =>
          (angular
            .element(document)
            .injector()
            .get('mainApplicationGroup') as any).primaryApplication,
      },
    });
  }

  angular.element(document).ready(() => {
    angular.bootstrap(document, ['app']);
  });
};

if (__WEB__) {
  startApplication(
    (window as any)._default_sync_server,
    new BrowserBridge(__VERSION__),
    (window as any)._next_version_sync_server
  );
} else {
  (window as any).startApplication = startApplication;
}
