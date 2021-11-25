import { RootScopeMessages } from './../../messages';
import { WebDirective } from '@/types';
import { getPlatformString } from '@/utils';
import template from './application-view.pug';
import { AppStateEvent, PanelResizedData } from '@/ui_models/app_state';
import { ApplicationEvent, Challenge, ProtectionSessionDurations, removeFromArray, SNNote } from '@standardnotes/snjs';
import {
  DURATION_TO_POSTPONE_PROTECTED_NOTE_LOCK_WHILE_EDITING,
  PANEL_NAME_NOTES,
  PANEL_NAME_TAGS
} from '@/views/constants';
import { STRING_DEFAULT_FILE_ERROR } from '@/strings';
import { PureViewCtrl } from '@Views/abstract/pure_view_ctrl';
import { alertDialog } from '@/services/alertService';

class ApplicationViewCtrl extends PureViewCtrl<unknown, {
  ready?: boolean,
  needsUnlock?: boolean,
  appClass: string,
}> {
  public platformString: string;
  private notesCollapsed = false;
  private tagsCollapsed = false;
  /**
   * To prevent stale state reads (setState is async),
   * challenges is a mutable array
   */
  private challenges: Challenge[] = [];
  private protectionTimeoutId: number | null = null;
  private isProtectionExpiryDateChangeTriggeredByUser = false;

  /* @ngInject */
  constructor(
    private $location: ng.ILocationService,
    private $rootScope: ng.IRootScopeService,
    $timeout: ng.ITimeoutService
  ) {
    super($timeout);
    this.$location = $location;
    this.$rootScope = $rootScope;
    this.platformString = getPlatformString();
    this.state = this.getInitialState();
    this.onDragDrop = this.onDragDrop.bind(this);
    this.onDragOver = this.onDragOver.bind(this);
    this.addDragDropHandlers();
  }

  deinit() {
    (this.$location as unknown) = undefined;
    (this.$rootScope as unknown) = undefined;
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

  getInitialState() {
    return {
      appClass: '',
      challenges: [],
    };
  }

  async loadApplication() {
    this.application.componentManager.setDesktopManager(
      this.application.getDesktopService()
    );
    await this.application.prepareForLaunch({
      receiveChallenge: async (challenge) => {
        this.$timeout(() => {
          this.challenges.push(challenge);
        });
      }
    });
    await this.application.launch();
  }

  public async removeChallenge(challenge: Challenge) {
    this.$timeout(() => {
      removeFromArray(this.challenges, challenge);
    });
  }

  async onAppStart() {
    super.onAppStart();
    this.setState({
      ready: true,
      needsUnlock: this.application.hasPasscode()
    });
  }

  async onAppLaunch() {
    super.onAppLaunch();
    this.setState({ needsUnlock: false });
    this.handleDemoSignInFromParams();
  }

  onUpdateAvailable() {
    this.$rootScope.$broadcast(RootScopeMessages.NewUpdateAvailable);
  }

  /** @override */
  async onAppEvent(eventName: ApplicationEvent) {
    super.onAppEvent(eventName);
    switch (eventName) {
      case ApplicationEvent.LocalDatabaseReadError:
        alertDialog({
          text: 'Unable to load local database. Please restart the app and try again.'
        });
        break;
      case ApplicationEvent.LocalDatabaseWriteError:
        alertDialog({
          text: 'Unable to write to local database. Please restart the app and try again.'
        });
        break;
      case ApplicationEvent.ProtectionSessionExpiryDateChanged:
        this.isProtectionExpiryDateChangeTriggeredByUser = true;
        await this.handleProtectionSessionExpiryDateChange();
        break;
    }
  }

  async handleProtectionSessionExpiryDateChange() {
    const protectionExpiryDate = this.application.getProtectionSessionExpiryDate();
    const now = new Date();

    if (protectionExpiryDate < now) {
      const selectedNotes = this.appState.notes.selectedNotes;
      const allSelectedNotes = Object.values(selectedNotes);
      const selectedProtectedNotes = allSelectedNotes.filter(note => note.protected);

      if (selectedProtectedNotes.length > 0) {
        const firstSelectedProtectedNote = selectedProtectedNotes[0];
        const firstSelectedProtectedNoteModifiedTime = firstSelectedProtectedNote.userModifiedDate.getTime();
        const secondsBetweenProtectionExpirationAndNoteModification = (
          this.application.getProtectionSessionExpiryDate().getTime() - firstSelectedProtectedNoteModifiedTime
        ) / 1000;
        const secondsPassedAfterFirstSelectedNoteModification = (Date.now() - firstSelectedProtectedNoteModifiedTime) / 1000;

        const shouldImmediatelyHideContents = this.getShouldImmediatelyHideContents({
          secondsBetweenProtectionExpirationAndNoteModification,
          protectionExpiryDate,
          secondsPassedAfterFirstSelectedNoteModification
        });

        if (shouldImmediatelyHideContents) {
          await this.handleProtectionExpiration({
            selectedProtectedNotes,
            allSelectedNotes
          });
        } else {
          const secondsUntilNextCheck = this.getSecondsUntilNextCheck({
            secondsBetweenProtectionExpirationAndNoteModification,
            secondsPassedAfterFirstSelectedNoteModification
          });

          if (this.protectionTimeoutId) {
            clearTimeout(this.protectionTimeoutId);
          }
          this.protectionTimeoutId = setTimeout(async () => {
            await this.handleProtectionSessionExpiryDateChange();
          }, secondsUntilNextCheck * 1000);
        }
      }
    }
  }

  async handleProtectionExpiration({ selectedProtectedNotes, allSelectedNotes }: {
    selectedProtectedNotes: SNNote[],
    allSelectedNotes: SNNote[]
  }) {
    await this.appState.getActiveEditor().reset();

    const selectedProtectedNotesUuids = selectedProtectedNotes.map(note => note.uuid);
    const firstSelectedProtectedNote = selectedProtectedNotes[0];

    if (allSelectedNotes.length === 1) {
      if (await this.application.authorizeNoteAccess(firstSelectedProtectedNote)) {
        await this.appState.notes.selectNote(firstSelectedProtectedNote.uuid);
        await this.appState.getActiveEditor().setNote(firstSelectedProtectedNote);
      } else {
        await this.appState.notes.unselectNotesByUuids(selectedProtectedNotesUuids);
      }
    } else {
      if (!(await this.application.authorizeNoteAccess(firstSelectedProtectedNote))) {
        await this.appState.notes.unselectNotesByUuids(selectedProtectedNotesUuids);

        const unprotectedSelectedNotes = Object.values(this.appState.notes.selectedNotes);
        if (unprotectedSelectedNotes.length === 1) {
          await this.appState.notes.selectNote(unprotectedSelectedNotes[0].uuid);
        }
      }
    }
  }

  /** @override */
  async onAppStateEvent(eventName: AppStateEvent, data?: unknown) {
    if (eventName === AppStateEvent.PanelResized) {
      const { panel, collapsed } = data as PanelResizedData;
      if (panel === PANEL_NAME_NOTES) {
        this.notesCollapsed = collapsed;
      }
      if (panel === PANEL_NAME_TAGS) {
        this.tagsCollapsed = collapsed;
      }
      let appClass = "";
      if (this.notesCollapsed) { appClass += "collapsed-notes"; }
      if (this.tagsCollapsed) { appClass += " collapsed-tags"; }
      this.setState({ appClass });
    } else if (eventName === AppStateEvent.WindowDidFocus) {
      if (!(await this.application.isLocked())) {
        this.application.sync();
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
    if (event.dataTransfer?.files.length) {
      event.preventDefault();
    }
  }

  onDragDrop(event: DragEvent) {
    if (event.dataTransfer?.files.length) {
      event.preventDefault();
      void alertDialog({
        text: STRING_DEFAULT_FILE_ERROR
      });
    }
  }

  async handleDemoSignInFromParams() {
    if (
      this.$location.search().demo === 'true' &&
        !this.application.hasAccount()
    ) {
      await this.application.setCustomHost(
        'https://syncing-server-demo.standardnotes.com'
      );
      this.application.signIn(
        'demo@standardnotes.org',
        'password',
      );
    }
  }

  private getShouldImmediatelyHideContents({
                                             secondsBetweenProtectionExpirationAndNoteModification,
                                             protectionExpiryDate,
                                             secondsPassedAfterFirstSelectedNoteModification,
                                           }: {
    secondsBetweenProtectionExpirationAndNoteModification: number,
    protectionExpiryDate: Date,
    secondsPassedAfterFirstSelectedNoteModification: number;
  }) {
    if (this.appState.notes.selectedProtectedNoteAccessDuration === ProtectionSessionDurations[0].valueInSeconds && this.isProtectionExpiryDateChangeTriggeredByUser) {
      return false;
    }

    if (secondsBetweenProtectionExpirationAndNoteModification > 0) {
      if (secondsBetweenProtectionExpirationAndNoteModification > DURATION_TO_POSTPONE_PROTECTED_NOTE_LOCK_WHILE_EDITING) {
        return true;
      }
      if ((Date.now() - protectionExpiryDate.getTime()) / 1000 > DURATION_TO_POSTPONE_PROTECTED_NOTE_LOCK_WHILE_EDITING) {
        return true;
      }
    }
    if (secondsPassedAfterFirstSelectedNoteModification > DURATION_TO_POSTPONE_PROTECTED_NOTE_LOCK_WHILE_EDITING) {
      return true;
    }
    return false;
  }

  private getSecondsUntilNextCheck({
                                     secondsBetweenProtectionExpirationAndNoteModification,
                                     secondsPassedAfterFirstSelectedNoteModification
                                   }: {
    secondsBetweenProtectionExpirationAndNoteModification: number;
    secondsPassedAfterFirstSelectedNoteModification: number;
  }) {
    let secondsUntilNextCheck = 0;
    if (this.appState.notes.selectedProtectedNoteAccessDuration === ProtectionSessionDurations[0].valueInSeconds) {
      if (this.isProtectionExpiryDateChangeTriggeredByUser) {
        secondsUntilNextCheck = DURATION_TO_POSTPONE_PROTECTED_NOTE_LOCK_WHILE_EDITING;
        this.isProtectionExpiryDateChangeTriggeredByUser = false;
      } else {
        secondsUntilNextCheck = DURATION_TO_POSTPONE_PROTECTED_NOTE_LOCK_WHILE_EDITING - secondsPassedAfterFirstSelectedNoteModification;
      }
    } else if (secondsBetweenProtectionExpirationAndNoteModification > 0) {
      secondsUntilNextCheck = DURATION_TO_POSTPONE_PROTECTED_NOTE_LOCK_WHILE_EDITING - secondsBetweenProtectionExpirationAndNoteModification;
    } else {
      secondsUntilNextCheck = DURATION_TO_POSTPONE_PROTECTED_NOTE_LOCK_WHILE_EDITING - secondsPassedAfterFirstSelectedNoteModification;
    }
    return secondsUntilNextCheck;
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
