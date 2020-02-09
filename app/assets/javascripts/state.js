import { isDesktopApplication } from '@/utils';
import pull from 'lodash/pull';
import { ProtectedActions } from 'snjs';

export const AppStateEvents = {
  TagChanged: 1,
  NoteChanged: 2,
  PreferencesChanged: 3,
  PanelResized: 4,
  EditorFocused: 5,
  BeganBackupDownload: 6,
  EndedBackupDownload: 7,
  DesktopExtsReady: 8,
  WindowDidFocus: 9,
  WindowDidBlur: 10,
};

export const EventSources = {
  UserInteraction: 1,
  Script: 2
};

export class AppState {
  /* @ngInject */
  constructor(
    $timeout,
    $rootScope,
    application,

  ) {
    this.$timeout = $timeout;
    this.$rootScope = $rootScope;
    this.application = application;
    this.observers = [];
    this.registerVisibilityObservers();
  }

  registerVisibilityObservers() {
    if (isDesktopApplication()) {
      this.$rootScope.$on('window-lost-focus', () => {
        this.notifyEvent(AppStateEvents.WindowDidBlur);
      });
      this.$rootScope.$on('window-gained-focus', () => {
        this.notifyEvent(AppStateEvents.WindowDidFocus);
      });
    } else {
      /* Tab visibility listener, web only */
      document.addEventListener('visibilitychange', (e) => {
        const visible = document.visibilityState === "visible";
        const event = visible
          ? AppStateEvents.WindowDidFocus
          : AppStateEvents.WindowDidBlur;
        this.notifyEvent(event);
      });
    }
  }

  /** @returns  A function that unregisters this observer */
  addObserver(callback) {
    this.observers.push(callback);
    return () => {
      pull(this.observers, callback);
    };
  }

  async notifyEvent(eventName, data) {
    /** 
     * Timeout is particullary important so we can give all initial 
     * controllers a chance to construct before propogting any events *
     */
    return new Promise((resolve) => {
      this.$timeout(async () => {
        for (const callback of this.observers) {
          await callback(eventName, data);
        }
        resolve();
      });
    });
  }

  setSelectedTag(tag) {
    if (this.selectedTag === tag) {
      return;
    }
    const previousTag = this.selectedTag;
    this.selectedTag = tag;
    this.notifyEvent(
      AppStateEvents.TagChanged,
      { 
        tag: tag,
        previousTag: previousTag 
      }
    );
  }

  async setSelectedNote(note) {
    const run = async () => {
      const previousNote = this.selectedNote;
      this.selectedNote = note;
      await this.notifyEvent(
        AppStateEvents.NoteChanged,
        { previousNote: previousNote }
      );
    };
    if (note && note.content.protected &&
      await this.application.privilegesManager.actionRequiresPrivilege(
        ProtectedActions.ViewProtectedNotes
      )) {
      this.godService.presentPrivilegesModal(
        ProtectedActions.ViewProtectedNotes,
        run
      );
    } else {
      run();
    }
  }

  getSelectedTag() {
    return this.selectedTag;
  }

  getSelectedNote() {
    return this.selectedNote;
  }

  setUserPreferences(preferences) {
    this.userPreferences = preferences;
    this.notifyEvent(
      AppStateEvents.PreferencesChanged
    );
  }

  panelDidResize({ name, collapsed }) {
    this.notifyEvent(
      AppStateEvents.PanelResized,
      {
        panel: name,
        collapsed: collapsed
      }
    );
  }

  editorDidFocus(eventSource) {
    this.notifyEvent(
      AppStateEvents.EditorFocused,
      { eventSource: eventSource }
    );
  }

  beganBackupDownload() {
    this.notifyEvent(
      AppStateEvents.BeganBackupDownload
    );
  }

  endedBackupDownload({ success }) {
    this.notifyEvent(
      AppStateEvents.EndedBackupDownload,
      { success: success }
    );
  }

  /**
   * When the desktop appplication extension server is ready.
   */
  desktopExtensionsReady() {
    this.notifyEvent(
      AppStateEvents.DesktopExtsReady
    );
  }

}
