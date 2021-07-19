import { isDesktopApplication } from '@/utils';
import pull from 'lodash/pull';
import {
  ApplicationEvent,
  SNTag,
  SNNote,
  ContentType,
  PayloadSource,
  DeinitSource,
  PrefKey,
} from '@standardnotes/snjs';
import { WebApplication } from '@/ui_models/application';
import { Editor } from '@/ui_models/editor';
import { action, makeObservable, observable } from 'mobx';
import { Bridge } from '@/services/bridge';
import { storage, StorageKey } from '@/services/localStorage';
import { ActionsMenuState } from './actions_menu_state';
import { NoteTagsState } from './note_tags_state';
import { NoAccountWarningState } from './no_account_warning_state';
import { SyncState } from './sync_state';
import { SearchOptionsState } from './search_options_state';
import { NotesState } from './notes_state';
import { TagsState } from './tags_state';
import { AccountMenuState } from '@/ui_models/app_state/account_menu_state';
import { PreferencesState } from './preferences_state';

export enum AppStateEvent {
  TagChanged,
  ActiveEditorChanged,
  PanelResized,
  EditorFocused,
  BeganBackupDownload,
  EndedBackupDownload,
  WindowDidFocus,
  WindowDidBlur,
}

export type PanelResizedData = {
  panel: string;
  collapsed: boolean;
};

export enum EventSource {
  UserInteraction,
  Script,
}

type ObserverCallback = (event: AppStateEvent, data?: any) => Promise<void>;

export class AppState {
  readonly enableUnfinishedFeatures: boolean = (window as any)
    ?._enable_unfinished_features;

  $rootScope: ng.IRootScopeService;
  $timeout: ng.ITimeoutService;
  application: WebApplication;
  observers: ObserverCallback[] = [];
  locked = true;
  unsubApp: any;
  rootScopeCleanup1: any;
  rootScopeCleanup2: any;
  onVisibilityChange: any;
  selectedTag?: SNTag;
  showBetaWarning: boolean;
  readonly accountMenu: AccountMenuState;
  readonly actionsMenu = new ActionsMenuState();
  readonly preferences = new PreferencesState();
  readonly noAccountWarning: NoAccountWarningState;
  readonly noteTags: NoteTagsState;
  readonly sync = new SyncState();
  readonly searchOptions: SearchOptionsState;
  readonly notes: NotesState;
  readonly tags: TagsState;
  isSessionsModalVisible = false;

  private appEventObserverRemovers: (() => void)[] = [];

  /* @ngInject */
  constructor(
    $rootScope: ng.IRootScopeService,
    $timeout: ng.ITimeoutService,
    application: WebApplication,
    private bridge: Bridge
  ) {
    this.$timeout = $timeout;
    this.$rootScope = $rootScope;
    this.application = application;
    this.notes = new NotesState(
      application,
      this,
      async () => {
        await this.notifyEvent(AppStateEvent.ActiveEditorChanged);
      },
      this.appEventObserverRemovers
    );
    this.noteTags = new NoteTagsState(
      application,
      this,
      this.appEventObserverRemovers
    );
    this.tags = new TagsState(application, this.appEventObserverRemovers);
    this.noAccountWarning = new NoAccountWarningState(
      application,
      this.appEventObserverRemovers
    );
    this.accountMenu = new AccountMenuState(
      application,
      this.appEventObserverRemovers,
    );
    this.searchOptions = new SearchOptionsState(
      application,
      this.appEventObserverRemovers
    );
    this.addAppEventObserver();
    this.streamNotesAndTags();
    this.onVisibilityChange = () => {
      const visible = document.visibilityState === 'visible';
      const event = visible
        ? AppStateEvent.WindowDidFocus
        : AppStateEvent.WindowDidBlur;
      this.notifyEvent(event);
    };
    this.registerVisibilityObservers();

    if (this.bridge.appVersion.includes('-beta')) {
      this.showBetaWarning = storage.get(StorageKey.ShowBetaWarning) ?? true;
    } else {
      this.showBetaWarning = false;
    }

    makeObservable(this, {
      showBetaWarning: observable,
      isSessionsModalVisible: observable,
      preferences: observable,

      enableBetaWarning: action,
      disableBetaWarning: action,
      openSessionsModal: action,
      closeSessionsModal: action,
    });
  }

  deinit(source: DeinitSource): void {
    if (source === DeinitSource.SignOut) {
      storage.remove(StorageKey.ShowBetaWarning);
      this.noAccountWarning.reset();
    }
    this.actionsMenu.reset();
    this.unsubApp?.();
    this.unsubApp = undefined;
    this.observers.length = 0;
    this.appEventObserverRemovers.forEach((remover) => remover());
    this.appEventObserverRemovers.length = 0;
    if (this.rootScopeCleanup1) {
      this.rootScopeCleanup1();
      this.rootScopeCleanup2();
      this.rootScopeCleanup1 = undefined;
      this.rootScopeCleanup2 = undefined;
    }
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.onVisibilityChange = undefined;
  }

  openSessionsModal() {
    this.isSessionsModalVisible = true;
  }

  closeSessionsModal() {
    this.isSessionsModalVisible = false;
  }

  disableBetaWarning() {
    this.showBetaWarning = false;
    storage.set(StorageKey.ShowBetaWarning, false);
  }

  enableBetaWarning() {
    this.showBetaWarning = true;
    storage.set(StorageKey.ShowBetaWarning, true);
  }

  /**
   * Creates a new editor if one doesn't exist. If one does, we'll replace the
   * editor's note with an empty one.
   */
  async createEditor(title?: string) {
    const activeEditor = this.getActiveEditor();
    const activeTagUuid = this.selectedTag
      ? this.selectedTag.isSmartTag
        ? undefined
        : this.selectedTag.uuid
      : undefined;

    if (!activeEditor) {
      this.application.editorGroup.createEditor(
        undefined,
        title,
        activeTagUuid
      );
    } else {
      await activeEditor.reset(title, activeTagUuid);
    }
  }

  getActiveEditor() {
    return this.application.editorGroup.editors[0];
  }

  getEditors() {
    return this.application.editorGroup.editors;
  }

  closeEditor(editor: Editor) {
    this.application.editorGroup.closeEditor(editor);
  }

  closeActiveEditor() {
    this.application.editorGroup.closeActiveEditor();
  }

  closeAllEditors() {
    this.application.editorGroup.closeAllEditors();
  }

  editorForNote(note: SNNote) {
    for (const editor of this.getEditors()) {
      if (editor.note.uuid === note.uuid) {
        return editor;
      }
    }
  }

  streamNotesAndTags() {
    this.application!.streamItems(
      [ContentType.Note, ContentType.Tag],
      async (items, source) => {
        /** Close any editors for deleted/trashed/archived notes */
        if (source === PayloadSource.PreSyncSave) {
          const notes = items.filter(
            (candidate) => candidate.content_type === ContentType.Note
          ) as SNNote[];
          for (const note of notes) {
            const editor = this.editorForNote(note);
            if (!editor) {
              continue;
            }
            if (note.deleted) {
              this.closeEditor(editor);
            } else if (
              note.trashed &&
              !this.selectedTag?.isTrashTag &&
              !this.searchOptions.includeTrashed
            ) {
              this.closeEditor(editor);
            } else if (
              note.archived &&
              !this.selectedTag?.isArchiveTag &&
              !this.searchOptions.includeArchived &&
              !this.application.getPreference(PrefKey.NotesShowArchived, false)
            ) {
              this.closeEditor(editor);
            }
          }
        }
        if (this.selectedTag) {
          const matchingTag = items.find(
            (candidate) => candidate.uuid === this.selectedTag!.uuid
          );
          if (matchingTag) {
            this.selectedTag = matchingTag as SNTag;
          }
        }
      }
    );
  }

  addAppEventObserver() {
    this.unsubApp = this.application.addEventObserver(async (eventName) => {
      switch (eventName) {
        case ApplicationEvent.Started:
          this.locked = true;
          break;
        case ApplicationEvent.Launched:
          this.locked = false;
          break;
        case ApplicationEvent.SyncStatusChanged:
          this.sync.update(this.application.getSyncStatus());
          break;
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
      this.rootScopeCleanup2 = this.$rootScope.$on(
        'window-gained-focus',
        () => {
          this.notifyEvent(AppStateEvent.WindowDidFocus);
        }
      );
    } else {
      /* Tab visibility listener, web only */
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
    return new Promise<void>((resolve) => {
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
    this.notifyEvent(AppStateEvent.TagChanged, {
      tag: tag,
      previousTag: previousTag,
    });
  }

  /** Returns the tags that are referncing this note */
  public getNoteTags(note: SNNote) {
    return this.application.referencingForItem(note).filter((ref) => {
      return ref.content_type === ContentType.Tag;
    }) as SNTag[];
  }

  public getSelectedTag() {
    return this.selectedTag;
  }

  panelDidResize(name: string, collapsed: boolean) {
    const data: PanelResizedData = {
      panel: name,
      collapsed: collapsed,
    };
    this.notifyEvent(AppStateEvent.PanelResized, data);
  }

  editorDidFocus(eventSource: EventSource) {
    this.notifyEvent(AppStateEvent.EditorFocused, { eventSource: eventSource });
  }

  beganBackupDownload() {
    this.notifyEvent(AppStateEvent.BeganBackupDownload);
  }

  endedBackupDownload(success: boolean) {
    this.notifyEvent(AppStateEvent.EndedBackupDownload, { success: success });
  }
}
