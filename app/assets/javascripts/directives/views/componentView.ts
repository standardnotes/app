import { WebApplication } from '@/ui_models/application';
import { SNComponent } from 'snjs';
import { WebDirective } from './../../types';
import template from '%/directives/component-view.pug';
import { isDesktopApplication } from '../../utils';
/**
 * The maximum amount of time we'll wait for a component
 * to load before displaying error
 */
const MAX_LOAD_THRESHOLD = 4000;

const VISIBILITY_CHANGE_LISTENER_KEY = 'visibilitychange';

interface ComponentViewScope {
  component: SNComponent
  onLoad?: (component: SNComponent) => void
  manualDealloc: boolean
  application: WebApplication
}

class ComponentViewCtrl implements ComponentViewScope {

  $rootScope: ng.IRootScopeService
  $timeout: ng.ITimeoutService
  componentValid = true
  cleanUpOn: () => void
  unregisterComponentHandler!: () => void
  component!: SNComponent
  onLoad?: (component: SNComponent) => void
  manualDealloc = false
  application!: WebApplication
  unregisterDesktopObserver!: () => void
  didRegisterObservers = false
  lastComponentValue?: SNComponent
  issueLoading = false
  reloading = false
  expired = false
  loading = false
  didAttemptReload = false
  error: 'offline-restricted' | 'url-missing' | undefined
  loadTimeout: any

  /* @ngInject */
  constructor(
    $scope: ng.IScope,
    $rootScope: ng.IRootScopeService,
    $timeout: ng.ITimeoutService,
  ) {
    this.$rootScope = $rootScope;
    this.$timeout = $timeout;
    this.cleanUpOn = $scope.$on('ext-reload-complete', () => {
      this.reloadStatus(false);
    });

    /** To allow for registering events */
    this.onVisibilityChange = this.onVisibilityChange.bind(this);
  }

  $onDestroy() {
    this.cleanUpOn();
    (this.cleanUpOn as any) = undefined;
    this.unregisterComponentHandler();
    (this.unregisterComponentHandler as any) = undefined;
    if (this.component && !this.manualDealloc) {
      /* application and componentManager may be destroyed if this onDestroy is part of 
      the entire application being destroyed rather than part of just a single component
      view being removed */
      if (this.application && this.application.componentManager) {
        this.application.componentManager.deregisterComponent(this.component);
      }
    }
    this.unregisterDesktopObserver();
    (this.unregisterDesktopObserver as any) = undefined;
    document.removeEventListener(
      VISIBILITY_CHANGE_LISTENER_KEY,
      this.onVisibilityChange
    );
    (this.component as any) = undefined;
    this.onLoad = undefined;
    (this.application as any) = undefined;
    (this.onVisibilityChange as any) = undefined;
  }

  $onChanges() {
    if (!this.didRegisterObservers) {
      this.didRegisterObservers = true;
      this.registerComponentHandlers();
      this.registerPackageUpdateObserver();
    }
    const newComponent = this.component;
    const oldComponent = this.lastComponentValue;
    this.lastComponentValue = newComponent;
    if (oldComponent && oldComponent !== newComponent) {
      this.application.componentManager!.deregisterComponent(
        oldComponent
      );
    }
    if (newComponent && newComponent !== oldComponent) {
      this.application.componentManager!.registerComponent(
        newComponent
      )
      this.reloadStatus();
    }
  }

  registerPackageUpdateObserver() {
    this.unregisterDesktopObserver = this.application.getDesktopService()
      .registerUpdateObserver((component: SNComponent) => {
        if (component === this.component && component.active) {
          this.reloadComponent();
        }
      });
  }

  registerComponentHandlers() {
    this.unregisterComponentHandler = this.application.componentManager!.registerHandler({
      identifier: 'component-view-' + Math.random(),
      areas: [this.component.area],
      activationHandler: (component) => {
        if (component !== this.component) {
          return;
        }
        this.$timeout(() => {
          this.handleActivation();
        });
      },
      actionHandler: (component, action, data) => {
        if (action === 'set-size') {
          this.application.componentManager!.handleSetSizeEvent(component, data);
        }
      }
    });
  }

  onVisibilityChange() {
    if (document.visibilityState === 'hidden') {
      return;
    }
    if (this.issueLoading) {
      this.reloadComponent();
    }
  }

  async reloadComponent() {
    this.componentValid = false;
    await this.application.componentManager!.reloadComponent(this.component);
    this.reloadStatus();
  }

  reloadStatus(doManualReload = true) {
    this.reloading = true;
    const component = this.component;
    const previouslyValid = this.componentValid;
    const offlineRestricted = component.offlineOnly && !isDesktopApplication();
    const hasUrlError = function () {
      if (isDesktopApplication()) {
        return !component.local_url && !component.hasValidHostedUrl();
      } else {
        return !component.hasValidHostedUrl();
      }
    }();
    this.expired = component.valid_until && component.valid_until <= new Date();
    const readonlyState = this.application.componentManager!.getReadonlyStateForComponent(component);
    if (!readonlyState.lockReadonly) {
      this.application.componentManager!.setReadonlyStateForComponent(component, true);
    }
    this.componentValid = !offlineRestricted && !hasUrlError;
    if (!this.componentValid) {
      this.loading = false;
    }
    if (offlineRestricted) {
      this.error = 'offline-restricted';
    } else if (hasUrlError) {
      this.error = 'url-missing';
    } else {
      this.error = undefined;
    }
    if (this.componentValid !== previouslyValid) {
      if (this.componentValid) {
        this.application.componentManager!.reloadComponent(component);
      }
    }
    if (this.expired && doManualReload) {
      this.$rootScope.$broadcast('reload-ext-dat');
    }

    this.$timeout(() => {
      this.reloading = false;
    }, 500);
  }

  handleActivation() {
    if (!this.component || !this.component.active) {
      return;
    }
    const iframe = this.application.componentManager!.iframeForComponent(
      this.component
    );
    if (!iframe) {
      return;
    }
    this.loading = true;
    if (this.loadTimeout) {
      this.$timeout.cancel(this.loadTimeout);
    }
    this.loadTimeout = this.$timeout(() => {
      this.handleIframeLoadTimeout();
    }, MAX_LOAD_THRESHOLD);

    iframe.onload = (event) => {
      this.handleIframeLoad(iframe);
    };
  }

  async handleIframeLoadTimeout() {
    if (this.loading) {
      this.loading = false;
      this.issueLoading = true;
      if (!this.didAttemptReload) {
        this.didAttemptReload = true;
        this.reloadComponent();
      } else {
        document.addEventListener(
          VISIBILITY_CHANGE_LISTENER_KEY,
          this.onVisibilityChange
        );
      }
    }
  }

  async handleIframeLoad(iframe: HTMLIFrameElement) {
    let desktopError = false;
    if (isDesktopApplication()) {
      try {
        /** Accessing iframe.contentWindow.origin only allowed in desktop app. */
        if (!iframe.contentWindow!.origin || iframe.contentWindow!.origin === 'null') {
          desktopError = true;
        }
      } catch (e) { }
    }
    this.$timeout.cancel(this.loadTimeout);
    await this.application.componentManager!.registerComponentWindow(
      this.component,
      iframe.contentWindow!
    );
    const avoidFlickerTimeout = 7;
    this.$timeout(() => {
      this.loading = false;
      // eslint-disable-next-line no-unneeded-ternary
      this.issueLoading = desktopError ? true : false;
      this.onLoad && this.onLoad(this.component!);
    }, avoidFlickerTimeout);
  }

  disableActiveTheme() {
    this.application.getThemeService().deactivateAllThemes();
  }

  getUrl() {
    const url = this.application.componentManager!.urlForComponent(this.component);
    return url;
  }
}

export class ComponentView extends WebDirective {
  constructor() {
    super();
    this.restrict = 'E';
    this.template = template;
    this.scope = {
      component: '=',
      onLoad: '=?',
      manualDealloc: '=?',
      application: '='
    };
    this.controller = ComponentViewCtrl;
    this.controllerAs = 'ctrl';
    this.bindToController = true;
  }
}
