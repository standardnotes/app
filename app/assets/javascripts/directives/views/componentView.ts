import { WebApplication } from '@/ui_models/application';
import { SNComponent, ComponentAction, LiveItem } from 'snjs';
import { WebDirective } from './../../types';
import template from '%/directives/component-view.pug';
import { isDesktopApplication } from '../../utils';
/**
 * The maximum amount of time we'll wait for a component
 * to load before displaying error
 */
const MaxLoadThreshold = 4000;
const VisibilityChangeKey = 'visibilitychange';

interface ComponentViewScope {
  componentUuid: string
  onLoad?: (component: SNComponent) => void
  application: WebApplication
}

class ComponentViewCtrl implements ComponentViewScope {

  /** @scope */
  onLoad?: (component: SNComponent) => void
  componentUuid!: string
  application!: WebApplication
  liveComponent!: LiveItem<SNComponent>

  private $rootScope: ng.IRootScopeService
  private $timeout: ng.ITimeoutService
  private componentValid = true
  private cleanUpOn: () => void
  private unregisterComponentHandler!: () => void
  private unregisterDesktopObserver!: () => void
  private didRegisterObservers = false
  private issueLoading = false
  public reloading = false
  private expired = false
  private loading = false
  private didAttemptReload = false
  public error: 'offline-restricted' | 'url-missing' | undefined
  private loadTimeout: any

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
    this.unregisterDesktopObserver();
    (this.unregisterDesktopObserver as any) = undefined;
    this.liveComponent.deinit();
    (this.liveComponent as any) = undefined;
    (this.application as any) = undefined;
    (this.onVisibilityChange as any) = undefined;
    this.onLoad = undefined;
    document.removeEventListener(
      VisibilityChangeKey,
      this.onVisibilityChange
    );
  }

  $onInit() {
    this.liveComponent = new LiveItem(this.componentUuid, this.application);
    this.loadComponent();
    this.registerComponentHandlers();
    this.registerPackageUpdateObserver();
  }

  get component() {
    return this.liveComponent?.item;
  }

  private loadComponent() {
    if (!this.component) {
      throw 'Component view is missing component';
    }
    if (!this.component.active) {
      throw 'Component view component must be active';
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
    }, MaxLoadThreshold);
    iframe.onload = (event) => {
      this.handleIframeLoad(iframe);
    };
  }

  private registerPackageUpdateObserver() {
    this.unregisterDesktopObserver = this.application.getDesktopService()
      .registerUpdateObserver((component: SNComponent) => {
        if (component === this.component && component.active) {
          this.reloadComponent();
        }
      });
  }

  private registerComponentHandlers() {
    this.unregisterComponentHandler = this.application.componentManager!.registerHandler({
      identifier: 'component-view-' + Math.random(),
      areas: [this.component.area],
      actionHandler: (component, action, data) => {
        if (action === ComponentAction.SetSize) {
          this.application.componentManager!.handleSetSizeEvent(component, data);
        }
      }
    });
  }

  private onVisibilityChange() {
    if (document.visibilityState === 'hidden') {
      return;
    }
    if (this.issueLoading) {
      this.reloadComponent();
    }
  }

  public async reloadComponent() {
    this.componentValid = false;
    await this.application.componentManager!.reloadComponent(this.component);
    this.reloadStatus();
  }

  public reloadStatus(doManualReload = true) {
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

  private async handleIframeLoadTimeout() {
    if (this.loading) {
      this.loading = false;
      this.issueLoading = true;
      if (!this.didAttemptReload) {
        this.didAttemptReload = true;
        this.reloadComponent();
      } else {
        document.addEventListener(
          VisibilityChangeKey,
          this.onVisibilityChange
        );
      }
    }
  }

  private async handleIframeLoad(iframe: HTMLIFrameElement) {
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

  public getUrl() {
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
      componentUuid: '=',
      onLoad: '=?',
      application: '='
    };
    this.controller = ComponentViewCtrl;
    this.controllerAs = 'ctrl';
    this.bindToController = true;
  }
}
