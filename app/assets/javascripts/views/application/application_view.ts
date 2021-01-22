import { RootScopeMessages } from './../../messages';
import { WebDirective } from '@/types';
import { getPlatformString } from '@/utils';
import template from './application-view.pug';
import { AppStateEvent } from '@/ui_models/app_state';
import { ApplicationEvent, Challenge } from '@standardnotes/snjs';
import {
  PANEL_NAME_NOTES,
  PANEL_NAME_TAGS
} from '@/views/constants';
import {
  STRING_DEFAULT_FILE_ERROR
} from '@/strings';
import { PureViewCtrl } from '@Views/abstract/pure_view_ctrl';
import { alertDialog } from '@/services/alertService';

class ApplicationViewCtrl extends PureViewCtrl<unknown, {
  ready?: boolean,
  needsUnlock?: boolean,
  appClass: string,
  challenges: Challenge[]
}> {
  private $location?: ng.ILocationService
  private $rootScope?: ng.IRootScopeService
  public platformString: string
  private notesCollapsed = false
  private tagsCollapsed = false

  /* @ngInject */
  constructor(
    $location: ng.ILocationService,
    $rootScope: ng.IRootScopeService,
    $timeout: ng.ITimeoutService
  ) {
    super($timeout);
    this.$location = $location;
    this.$rootScope = $rootScope;
    this.platformString = getPlatformString();
    this.state = { appClass: '', challenges: [] };
    this.onDragDrop = this.onDragDrop.bind(this);
    this.onDragOver = this.onDragOver.bind(this);
    this.addDragDropHandlers();
  }

  deinit() {
    this.$location = undefined;
    this.$rootScope = undefined;
    (this.application as unknown) = undefined;
    window.removeEventListener('dragover', this.onDragOver, true);
    window.removeEventListener('drop', this.onDragDrop, true);
    (this.onDragDrop as unknown) = undefined;
    (this.onDragOver as unknown) = undefined;
    super.deinit();
  }

  $onInit() {
    super.$onInit();
    this.loadApplication();
  }

  async loadApplication() {
    this.application!.componentManager!.setDesktopManager(
      this.application!.getDesktopService()
    );
    await this.application!.prepareForLaunch({
      receiveChallenge: async (challenge) => {
        this.setState({
          challenges: this.state.challenges.concat(challenge)
        });
      }
    });
    await this.application!.launch();
  }

  public removeChallenge(challenge: Challenge) {
    this.setState({
      challenges: this.state.challenges.filter(c => c.id !== challenge.id)
    });
  }

  async onAppStart() {
    super.onAppStart();
    this.setState({
      ready: true,
      needsUnlock: this.application!.hasPasscode()
    });
  }

  async onAppLaunch() {
    super.onAppLaunch();
    this.setState({ needsUnlock: false });
    this.handleDemoSignInFromParams();
  }

  onUpdateAvailable() {
    this.$rootScope!.$broadcast(RootScopeMessages.NewUpdateAvailable);
  };

  /** @override */
  async onAppEvent(eventName: ApplicationEvent) {
    super.onAppEvent(eventName);
    if (eventName === ApplicationEvent.LocalDatabaseReadError) {
      alertDialog({
        text: 'Unable to load local database. Please restart the app and try again.'
      });
    } else if (eventName === ApplicationEvent.LocalDatabaseWriteError) {
      alertDialog({
        text: 'Unable to write to local database. Please restart the app and try again.'
      });
    }
  }

  /** @override */
  async onAppStateEvent(eventName: AppStateEvent, data?: any) {
    if (eventName === AppStateEvent.PanelResized) {
      if (data.panel === PANEL_NAME_NOTES) {
        this.notesCollapsed = data.collapsed;
      }
      if (data.panel === PANEL_NAME_TAGS) {
        this.tagsCollapsed = data.collapsed;
      }
      let appClass = "";
      if (this.notesCollapsed) { appClass += "collapsed-notes"; }
      if (this.tagsCollapsed) { appClass += " collapsed-tags"; }
      this.setState({ appClass });
    } else if (eventName === AppStateEvent.WindowDidFocus) {
      if (!(await this.application!.isLocked())) {
        this.application!.sync();
      }
    }
  }

  addDragDropHandlers() {
    /**
     * Disable dragging and dropping of files (but allow text) into main SN interface.
     * both 'dragover' and 'drop' are required to prevent dropping of files.
     * This will not prevent extensions from receiving drop events.
     */
    window.addEventListener('dragover', this.onDragOver, true);
    window.addEventListener('drop', this.onDragDrop, true);
  }

  onDragOver(event: DragEvent) {
    if (event.dataTransfer!.files.length > 0) {
      event.preventDefault();
    }
  }

  onDragDrop(event: DragEvent) {
    if (event.dataTransfer!.files.length > 0) {
      event.preventDefault();
      this.application!.alertService!.alert(
        STRING_DEFAULT_FILE_ERROR
      );
    }
  }

  async handleDemoSignInFromParams() {
    if (
      this.$location!.search().demo === 'true' &&
        !this.application.hasAccount()
    ) {
      await this.application!.setHost(
        'https://syncing-server-demo.standardnotes.org'
      );
      this.application!.signIn(
        'demo@standardnotes.org',
        'password',
      );
    }
  }
}

export class ApplicationView extends WebDirective {
  constructor() {
    super();
    this.template = template;
    this.controller = ApplicationViewCtrl;
    this.replace = true;
    this.controllerAs = 'self';
    this.bindToController = true;
    this.scope = {
      application: '='
    };
  }
}
