'use strict';

import angular from 'angular';
import { configRoutes } from './routes';

import {
  Home,
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

import { appDate, appDateTime, trusted } from './filters';

import {
  ActionsManager,
  ArchiveManager,
  AuthManager,
  ComponentManager,
  DBManager,
  DesktopManager,
  HttpManager,
  KeyboardManager,
  MigrationManager,
  ModelManager,
  NativeExtManager,
  PasscodeManager,
  PrivilegesManager,
  SessionHistory,
  SingletonManager,
  StatusManager,
  StorageManager,
  SyncManager,
  ThemeManager,
  AlertManager
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
  .directive('home', () => new Home())
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
  .directive('componentModal', () => new ComponentModal())
  .directive(
    'componentView',
    ($rootScope, componentManager, desktopManager, $timeout) =>
      new ComponentView($rootScope, componentManager, desktopManager, $timeout)
  )
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
  .filter('appDate', appDate)
  .filter('appDateTime', appDateTime)
  .filter('trusted', ['$sce', trusted]);

// Services
angular
  .module('app')
  .service('actionsManager', ActionsManager)
  .service('archiveManager', ArchiveManager)
  .service('authManager', AuthManager)
  .service('componentManager', ComponentManager)
  .service('dbManager', DBManager)
  .service('desktopManager', DesktopManager)
  .service('httpManager', HttpManager)
  .service('keyboardManager', KeyboardManager)
  .service('migrationManager', MigrationManager)
  .service('modelManager', ModelManager)
  .service('nativeExtManager', NativeExtManager)
  .service('passcodeManager', PasscodeManager)
  .service('privilegesManager', PrivilegesManager)
  .service('sessionHistory', SessionHistory)
  .service('singletonManager', SingletonManager)
  .service('statusManager', StatusManager)
  .service('storageManager', StorageManager)
  .service('syncManager', SyncManager)
  .service('alertManager', AlertManager)
  .service('themeManager', ThemeManager);
