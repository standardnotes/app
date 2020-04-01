import { isDesktopApplication } from '@/utils';
import pull from 'lodash/pull';
import { ProtectedActions, ApplicationEvents } from 'snjs';

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
    $rootScope,
    $timeout,
    application
  ) {
    this.$timeout = $timeout;
    this.$rootScope = $rootScope;
    this.application = application;
    this.observers = [];
    this.locked = true;
    this.registerVisibilityObservers();
    this.addAppEventObserver();
  }

  deinit() {
    this.unsubApp();
    this.unsubApp = null;
    this.observers.length = 0;
    if (this.rootScopeCleanup1) {
      this.rootScopeCleanup1();
      this.rootScopeCleanup2();
      this.rootScopeCleanup1 = null;
      this.rootScopeCleanup2 = null;
    }
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.onVisibilityChange = null;
  }

  addAppEventObserver() {
    this.unsubApp = this.application.addEventObserver(async (eventName) => {
      if (eventName === ApplicationEvents.Started) {
        this.locked = true;
      } else if (eventName === ApplicationEvents.Launched) {
        this.locked = false;
      }
    });
  }

  isLocked() {
    return this.locked;
  }

  registerVisibilityObservers() {
    if (isDesktopApplication()) {
      this.rootScopeCleanup1 = this.$rootScope.$on('window-lost-focus', () => {
        this.notifyEvent(AppStateEvents.WindowDidBlur);
      });
      this.rootScopeCleanup2 = this.$rootScope.$on('window-gained-focus', () => {
        this.notifyEvent(AppStateEvents.WindowDidFocus);
      });
    } else {
      /* Tab visibility listener, web only */
      this.onVisibilityChange = this.onVisibilityChange.bind(this);
      document.addEventListener('visibilitychange', this.onVisibilityChange);
    }
  }

  onVisibilityChange() {
    const visible = document.visibilityState === "visible";
    const event = visible
      ? AppStateEvents.WindowDidFocus
      : AppStateEvents.WindowDidBlur;
    this.notifyEvent(event);
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
      await this.application.application.privilegesService.actionRequiresPrivilege(
        ProtectedActions.ViewProtectedNotes
      )) {
      return new Promise((resolve) => {
        this.application.presentPrivilegesModal(
          ProtectedActions.ViewProtectedNotes,
          () => {
            run().then(resolve);
          }
        );
      });
    } else {
      return run();
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
