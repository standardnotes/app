'use strict';

declare const __VERSION__: string

import angular from 'angular';
import { configRoutes } from './routes';

import { ApplicationGroup } from './ui_models/application_group';

import {
  ApplicationGroupView,
  ApplicationView,
  EditorGroupView,
  EditorView,
  TagsView,
  NotesView,
  FooterView,
  ChallengeModal
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
  snEnter
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
  PrivilegesAuthModal,
  PrivilegesManagementModal,
  RevisionPreviewModal,
  SessionHistoryMenu,
  SyncResolutionMenu
} from './directives/views';

import { trusted } from './filters';
import { isDev } from './utils';

angular.module('app', ['ngSanitize']);

// Config
angular
  .module('app')
  .config(configRoutes)
  .constant('appVersion', __VERSION__);

// Controllers
angular
  .module('app')
  .directive('applicationGroupView', () => new ApplicationGroupView())
  .directive('applicationView', () => new ApplicationView())
  .directive('editorGroupView', () => new EditorGroupView())
  .directive('editorView', () => new EditorView())
  .directive('tagsView', () => new TagsView())
  .directive('notesView', () => new NotesView())
  .directive('footerView', () => new FooterView())

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
angular.module('app').service('mainApplicationGroup', ApplicationGroup);

// Debug
if (isDev) {
  Object.defineProperties(window, {
    application: {
      get: () =>
        (angular.element(document).injector().get('mainApplicationGroup') as any)
          .application,
    },
  });
}
