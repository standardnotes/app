'use strict';

import angular from 'angular';
import { configRoutes } from './routes';

import {
  Application
} from './application';

import {
  AppState
} from './state';

import {
  Root,
  TagsPanel,
  NotesPanel,
  EditorPanel,
  Footer,
  LockScreen
} from './controllers';

import {
  autofocus,
  clickOutside,
  delayHide,
  elemReady,
  fileChange,
  infiniteScroll,
  lowercase,
  selectOnClick,
  snEnter
} from './directives/functional';

import {
  AccountMenu,
  ActionsMenu,
  ChallengeModal,
  ComponentModal,
  ComponentView,
  ConflictResolutionModal,
  EditorMenu,
  InputModal,
  MenuRow,
  PanelResizer,
  PasswordWizard,
  PermissionsModal,
  PrivilegesAuthModal,
  PrivilegesManagementModal,
  RevisionPreviewModal,
  SessionHistoryMenu,
  SyncResolutionMenu
} from './directives/views';

import { trusted } from './filters';

import {
  ArchiveManager,
  DesktopManager,
  KeyboardManager,
  GodService,
  LockManager,
  NativeExtManager,
  PreferencesManager,
  StatusManager,
  ThemeManager,
} from './services';

angular.module('app', ['ngSanitize']);

// Config
angular
  .module('app')
  .config(configRoutes)
  .constant('appVersion', __VERSION__);

// Controllers
angular
  .module('app')
  .directive('root', () => new Root())
  .directive('tagsPanel', () => new TagsPanel())
  .directive('notesPanel', () => new NotesPanel())
  .directive('editorPanel', () => new EditorPanel())
  .directive('footer', () => new Footer())
  .directive('lockScreen', () => new LockScreen());

// Directives - Functional
angular
  .module('app')
  .directive('snAutofocus', ['$timeout', autofocus])
  .directive('clickOutside', ['$document', clickOutside])
  .directive('delayHide', delayHide)
  .directive('elemReady', elemReady)
  .directive('fileChange', fileChange)
  .directive('infiniteScroll', [
    '$rootScope',
    '$window',
    '$timeout',
    infiniteScroll
  ])
  .directive('lowercase', lowercase)
  .directive('selectOnClick', ['$window', selectOnClick])
  .directive('snEnter', snEnter);

// Directives - Views
angular
  .module('app')
  .directive('accountMenu', () => new AccountMenu())
  .directive('actionsMenu', () => new ActionsMenu())
  .directive('challengeModal', () => new ChallengeModal())
  .directive('componentModal', () => new ComponentModal())
  .directive('componentView', () => new ComponentView())
  // .directive(
  //   'componentView',
  //   ($rootScope, componentManager, desktopManager, $timeout) =>
  //     new ComponentView($rootScope, componentManager, desktopManager, $timeout)
  // )
  .directive('conflictResolutionModal', () => new ConflictResolutionModal())
  .directive('editorMenu', () => new EditorMenu())
  .directive('inputModal', () => new InputModal())
  .directive('menuRow', () => new MenuRow())
  .directive('panelResizer', () => new PanelResizer())
  .directive('passwordWizard', () => new PasswordWizard())
  .directive('permissionsModal', () => new PermissionsModal())
  .directive('privilegesAuthModal', () => new PrivilegesAuthModal())
  .directive('privilegesManagementModal', () => new PrivilegesManagementModal())
  .directive('revisionPreviewModal', () => new RevisionPreviewModal())
  .directive('sessionHistoryMenu', () => new SessionHistoryMenu())
  .directive('syncResolutionMenu', () => new SyncResolutionMenu());

// Filters
angular
  .module('app')
  .filter('trusted', ['$sce', trusted]);

// Services
angular
  .module('app')
  .service('appState', AppState)
  .service('application', Application)
  .service('archiveManager', ArchiveManager)
  .service('desktopManager', DesktopManager)
  .service('godService', GodService)
  .service('keyboardManager', KeyboardManager)
  .service('lockManager', LockManager)
  .service('nativeExtManager', NativeExtManager)
  .service('preferencesManager', PreferencesManager)
  .service('statusManager', StatusManager)
  .service('themeManager', ThemeManager);
