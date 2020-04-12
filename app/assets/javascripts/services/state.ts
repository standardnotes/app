import { WebApplication } from './../application';
import { isDesktopApplication } from '@/utils';
import pull from 'lodash/pull';
import { ProtectedAction, ApplicationEvent, SNTag, SNNote, SNUserPrefs, ContentType } from 'snjs';

export enum AppStateEvent {
  TagChanged = 1,
  NoteChanged = 2,
  PreferencesChanged = 3,
  PanelResized = 4,
  EditorFocused = 5,
  BeganBackupDownload = 6,
  EndedBackupDownload = 7,
  DesktopExtsReady = 8,
  WindowDidFocus = 9,
  WindowDidBlur = 10,
};

export enum EventSource {
  UserInteraction = 1,
  Script = 2
};

type ObserverCallback = (event: AppStateEvent, data?: any) => Promise<void>

export class AppState {
  $rootScope: ng.IRootScopeService
  $timeout: ng.ITimeoutService
  application: WebApplication
  observers: ObserverCallback[] = []
  locked = true
  unsubApp: any
  rootScopeCleanup1: any
  rootScopeCleanup2: any
  onVisibilityChange: any
  selectedTag?: SNTag
  selectedNote?: SNNote
  userPreferences?: SNUserPrefs

  /* @ngInject */
  constructor(
    $rootScope: ng.IRootScopeService,
    $timeout: ng.ITimeoutService,
    application: WebApplication
  ) {
    this.$timeout = $timeout;
    this.$rootScope = $rootScope;
    this.application = application;
    this.registerVisibilityObservers();
    this.addAppEventObserver();
    this.streamNotesAndTags();

    const onVisibilityChange = () => {
      const visible = document.visibilityState === "visible";
      const event = visible
        ? AppStateEvent.WindowDidFocus
        : AppStateEvent.WindowDidBlur;
      this.notifyEvent(event);
    }
    this.onVisibilityChange = onVisibilityChange.bind(this);
  }

  deinit() {
    this.unsubApp();
    this.unsubApp = undefined;
    this.observers.length = 0;
    if (this.rootScopeCleanup1) {
      this.rootScopeCleanup1();
      this.rootScopeCleanup2();
      this.rootScopeCleanup1 = undefined;
      this.rootScopeCleanup2 = undefined;
    }
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.onVisibilityChange = undefined;
  }

  streamNotesAndTags() {
    this.application!.streamItems(
      [ContentType.Note, ContentType.Tag],
      async (items) => {
        if(this.selectedNote) {
          const matchingNote = items.find((candidate) => candidate.uuid === this.selectedNote!.uuid);
          if(matchingNote) {
            this.selectedNote = matchingNote as SNNote;
          }
        }
        if (this.selectedTag) {
          const matchingTag = items.find((candidate) => candidate.uuid === this.selectedTag!.uuid);
          if (matchingTag) {
            this.selectedTag = matchingTag as SNTag;
          }
        }
      }
    );
  }


  addAppEventObserver() {
    this.unsubApp = this.application.addEventObserver(async (eventName) => {
      if (eventName === ApplicationEvent.Started) {
        this.locked = true;
      } else if (eventName === ApplicationEvent.Launched) {
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
        this.notifyEvent(AppStateEvent.WindowDidBlur);
      });
      this.rootScopeCleanup2 = this.$rootScope.$on('window-gained-focus', () => {
        this.notifyEvent(AppStateEvent.WindowDidFocus);
      });
    } else {
      /* Tab visibility listener, web only */
      this.onVisibilityChange = this.onVisibilityChange.bind(this);
      document.addEventListener('visibilitychange', this.onVisibilityChange);
    }
  }

  /** @returns  A function that unregisters this observer */
  addObserver(callback: ObserverCallback) {
    this.observers.push(callback);
    return () => {
      pull(this.observers, callback);
    };
  }

  async notifyEvent(eventName: AppStateEvent, data?: any) {
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

  setSelectedTag(tag: SNTag) {
    if (this.selectedTag === tag) {
      return;
    }
    const previousTag = this.selectedTag;
    this.selectedTag = tag;
    this.notifyEvent(
      AppStateEvent.TagChanged,
      {
        tag: tag,
        previousTag: previousTag
      }
    );
  }

  async setSelectedNote(note?: SNNote) {
    const run = async () => {
      const previousNote = this.selectedNote;
      this.selectedNote = note;
      await this.notifyEvent(
        AppStateEvent.NoteChanged,
        { previousNote: previousNote }
      );
    };
    if (note && note.safeContent.protected &&
      await this.application.privilegesService!.actionRequiresPrivilege(
        ProtectedAction.ViewProtectedNotes
      )) {
      return new Promise((resolve) => {
        this.application.presentPrivilegesModal(
          ProtectedAction.ViewProtectedNotes,
          () => {
            run().then(resolve);
          }
        );
      });
    } else {
      return run();
    }
  }

  /** Returns the tags that are referncing this note */
  getNoteTags(note: SNNote) {
    return this.application.referencingForItem(note).filter((ref) => {
      return ref.content_type === note.content_type;
    }) as SNTag[]
  }

  /** Returns the notes this tag references */
  getTagNotes(tag: SNTag) {
    return this.application.referencesForItem(tag).filter((ref) => {
      return ref.content_type === tag.content_type;
    }) as SNNote[]
  }

  getSelectedTag() {
    return this.selectedTag;
  }

  getSelectedNote() {
    return this.selectedNote;
  }

  setUserPreferences(preferences: SNUserPrefs) {
    this.userPreferences = preferences;
    this.notifyEvent(
      AppStateEvent.PreferencesChanged
    );
  }

  panelDidResize(name: string, collapsed: boolean) {
    this.notifyEvent(
      AppStateEvent.PanelResized,
      {
        panel: name,
        collapsed: collapsed
      }
    );
  }

  editorDidFocus(eventSource: EventSource) {
    this.notifyEvent(
      AppStateEvent.EditorFocused,
      { eventSource: eventSource }
    );
  }

  beganBackupDownload() {
    this.notifyEvent(
      AppStateEvent.BeganBackupDownload
    );
  }

  endedBackupDownload(success: boolean) {
    this.notifyEvent(
      AppStateEvent.EndedBackupDownload,
      { success: success }
    );
  }

  /**
   * When the desktop appplication extension server is ready.
   */
  desktopExtensionsReady() {
    this.notifyEvent(
      AppStateEvent.DesktopExtsReady
    );
  }
}
