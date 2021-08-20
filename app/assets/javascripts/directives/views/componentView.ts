import { RootScopeMessages } from './../../messages';
import { WebApplication } from '@/ui_models/application';
import { SNComponent, ComponentAction, LiveItem } from '@standardnotes/snjs';
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
  templateComponent!: SNComponent
  application!: WebApplication
  liveComponent!: LiveItem<SNComponent>

  private $rootScope: ng.IRootScopeService
  private $timeout: ng.ITimeoutService
  private componentValid = true
  private cleanUpOn: () => void
  private unregisterComponentHandler!: () => void
  private unregisterDesktopObserver!: () => void
  private issueLoading = false
  private isDeprecated = false
  private deprecationMessage = ''
  private deprecationMessageDismissed = false
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
    if(this.application.componentManager) {
      /** Component manager Can be destroyed already via locking */
      this.application.componentManager.onComponentIframeDestroyed(this.component.uuid);
      if(this.templateComponent) {
        this.application.componentManager.removeTemporaryTemplateComponent(this.templateComponent);
      }
    }
    if(this.liveComponent) {
      this.liveComponent.deinit();
    }
    this.cleanUpOn();
    (this.cleanUpOn as any) = undefined;
    this.unregisterComponentHandler();
    (this.unregisterComponentHandler as any) = undefined;
    this.unregisterDesktopObserver();
    (this.unregisterDesktopObserver as any) = undefined;
    (this.templateComponent as any) = undefined;
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
    if(this.componentUuid) {
      this.liveComponent = new LiveItem(this.componentUuid, this.application);
    } else {
      this.application.componentManager.addTemporaryTemplateComponent(this.templateComponent);
    }
    this.registerComponentHandlers();
    this.registerPackageUpdateObserver();
  }

  get component() {
    return this.templateComponent || this.liveComponent?.item;
  }

  /** @template */
  public onIframeInit() {
    /** Perform in timeout required so that dynamic iframe id is set (based on ctrl values) */
    this.$timeout(() => {
      this.loadComponent();
    });
  }

  private loadComponent() {
    if (!this.component) {
      throw Error('Component view is missing component');
    }
    if (!this.component.active && !this.component.isEditor()) {
      /** Editors don't need to be active to be displayed */
      throw Error('Component view component must be active');
    }
    const iframe = this.application.componentManager!.iframeForComponent(
      this.component.uuid
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
    iframe.onload = () => {
      this.reloadStatus();
      this.handleIframeLoad(iframe);
    };
  }

  private registerPackageUpdateObserver() {
    this.unregisterDesktopObserver = this.application.getDesktopService()
      .registerUpdateObserver((component: SNComponent) => {
        if (component.uuid === this.component.uuid && component.active) {
          this.reloadIframe();
        }
      });
  }

  private registerComponentHandlers() {
    this.unregisterComponentHandler = this.application.componentManager!.registerHandler({
      identifier: 'component-view-' + Math.random(),
      areas: [this.component.area],
      actionHandler: (component, action, data) => {
        switch (action) {
          case (ComponentAction.SetSize):
            this.application.componentManager!.handleSetSizeEvent(component, data);
            break;
          case (ComponentAction.KeyDown):
            this.application.io.handleComponentKeyDown(data.keyboardModifier);
            break;
          case (ComponentAction.KeyUp):
            this.application.io.handleComponentKeyUp(data.keyboardModifier);
            break;
          case (ComponentAction.Click):
            this.application.getAppState().notes.setContextMenuOpen(false);
            break;
          default:
            return;
        }
      }
    });
  }

  private reloadIframe() {
    this.$timeout(() => {
      this.reloading = true;
      this.$timeout(() => {
        this.reloading = false;
      });
    });
  }

  private dismissDeprecationMessage() {
    this.$timeout(() => {
      this.deprecationMessageDismissed = true;
    });
  }

  private onVisibilityChange() {
    if (document.visibilityState === 'hidden') {
      return;
    }
    if (this.issueLoading) {
      this.reloadIframe();
    }
  }

  public reloadStatus(doManualReload = true) {
    const component = this.component;
    const offlineRestricted = component.offlineOnly && !isDesktopApplication();
    const hasUrlError = function () {
      if (isDesktopApplication()) {
        return !component.local_url && !component.hasValidHostedUrl();
      } else {
        return !component.hasValidHostedUrl();
      }
    }();
    this.expired = component.valid_until && component.valid_until <= new Date();
    const readonlyState = this.application.componentManager!
      .getReadonlyStateForComponent(component);
    if (!readonlyState.lockReadonly) {
      this.application.componentManager!
        .setReadonlyStateForComponent(component, this.expired);
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
    if (this.expired && doManualReload) {
      this.$rootScope.$broadcast(RootScopeMessages.ReloadExtendedData);
    }
    this.isDeprecated = component.isDeprecated;
    this.deprecationMessage = component.package_info.deprecation_message!;
  }

  private async handleIframeLoadTimeout() {
    if (this.loading) {
      this.loading = false;
      this.issueLoading = true;
      if (!this.didAttemptReload) {
        this.didAttemptReload = true;
        this.reloadIframe();
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
      // eslint-disable-next-line no-empty
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

  /** @template */
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
      templateComponent: '=?',
      onLoad: '=?',
      application: '='
    };
    this.controller = ComponentViewCtrl;
    this.controllerAs = 'ctrl';
    this.bindToController = true;
  }
}
