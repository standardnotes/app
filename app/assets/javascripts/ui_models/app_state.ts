import { isDesktopApplication, isDev } from '@/utils';
import pull from 'lodash/pull';
import {
  ApplicationEvent,
  SNTag,
  SNNote,
  ContentType,
  PayloadSource,
  DeinitSource,
  UuidString,
  SyncOpStatus,
  PrefKey,
  SNApplication,
} from '@standardnotes/snjs';
import { WebApplication } from '@/ui_models/application';
import { Editor } from '@/ui_models/editor';
import { action, makeObservable, observable, runInAction } from 'mobx';
import { Bridge } from '@/services/bridge';
import { storage, StorageKey } from '@/services/localStorage';

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

class ActionsMenuState {
  hiddenExtensions: Record<UuidString, boolean> = {};

  constructor() {
    makeObservable(this, {
      hiddenExtensions: observable,
      toggleExtensionVisibility: action,
      reset: action,
    });
  }

  toggleExtensionVisibility(uuid: UuidString) {
    this.hiddenExtensions[uuid] = !this.hiddenExtensions[uuid];
  }

  reset() {
    this.hiddenExtensions = {};
  }
}

export class SyncState {
  inProgress = false;
  errorMessage?: string = undefined;
  humanReadablePercentage?: string = undefined;

  constructor() {
    makeObservable(this, {
      inProgress: observable,
      errorMessage: observable,
      humanReadablePercentage: observable,
      update: action,
    });
  }

  update(status: SyncOpStatus): void {
    this.errorMessage = status.error?.message;
    this.inProgress = status.syncInProgress;
    const stats = status.getStats();
    const completionPercentage =
      stats.uploadCompletionCount === 0
        ? 0
        : stats.uploadCompletionCount / stats.uploadTotalCount;

    if (completionPercentage === 0) {
      this.humanReadablePercentage = undefined;
    } else {
      this.humanReadablePercentage = completionPercentage.toLocaleString(
        undefined,
        { style: 'percent' }
      );
    }
  }
}

class AccountMenuState {
  show = false;
  constructor() {
    makeObservable(this, {
      show: observable,
      setShow: action,
      toggleShow: action,
    });
  }
  setShow(show: boolean) {
    this.show = show;
  }
  toggleShow() {
    this.show = !this.show;
  }
}

class NoAccountWarningState {
  show: boolean;
  constructor(application: SNApplication, appObservers: (() => void)[]) {
    this.show = application.hasAccount()
      ? false
      : storage.get(StorageKey.ShowNoAccountWarning) ?? true;

    appObservers.push(
      application.addEventObserver(async () => {
        runInAction(() => {
          this.show = false;
        });
      }, ApplicationEvent.SignedIn),
      application.addEventObserver(async () => {
        if (application.hasAccount()) {
          runInAction(() => {
            this.show = false;
          });
        }
      }, ApplicationEvent.Started)
    );

    makeObservable(this, {
      show: observable,
      hide: action,
    });
  }
  hide() {
    this.show = false;
    storage.set(StorageKey.ShowNoAccountWarning, false);
  }
  reset() {
    storage.remove(StorageKey.ShowNoAccountWarning);
  }
}

class SearchOptions {
  includeProtectedContents = false;
  includeArchived = false;
  includeTrashed = false;

  constructor(
    private application: WebApplication,
    appObservers: (() => void)[]
  ) {
    makeObservable(this, {
      includeProtectedContents: observable,
      includeTrashed: observable,
      includeArchived: observable,

      toggleIncludeArchived: action,
      toggleIncludeTrashed: action,
      toggleIncludeProtectedContents: action,
      refreshIncludeProtectedContents: action,
    });

    appObservers.push(
      this.application.addEventObserver(async () => {
        this.refreshIncludeProtectedContents();
      }, ApplicationEvent.ProtectionSessionExpiryDateChanged)
    );
  }

  toggleIncludeArchived = () => {
    this.includeArchived = !this.includeArchived;
  };

  toggleIncludeTrashed = () => {
    this.includeTrashed = !this.includeTrashed;
  };

  refreshIncludeProtectedContents = () => {
    if (
      this.includeProtectedContents &&
      this.application.areProtectionsEnabled()
    ) {
      this.includeProtectedContents = false;
    }
  };

  toggleIncludeProtectedContents = async () => {
    if (this.includeProtectedContents) {
      this.includeProtectedContents = false;
    } else {
      const authorized = await this.application.authorizeSearchingProtectedNotesText();
      runInAction(() => {
        this.includeProtectedContents = authorized;
      });
    }
  };
}

export class AppState {
  readonly enableUnfinishedFeatures =
    isDev || location.host.includes('app-dev.standardnotes.org');

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
  readonly accountMenu = new AccountMenuState();
  readonly actionsMenu = new ActionsMenuState();
  readonly noAccountWarning: NoAccountWarningState;
  readonly sync = new SyncState();
  readonly searchOptions;
  isSessionsModalVisible = false;
  mouseUp = Promise.resolve();

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
    this.noAccountWarning = new NoAccountWarningState(
      application,
      this.appEventObserverRemovers
    );
    this.searchOptions = new SearchOptions(
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
    document.addEventListener('mousedown', this.onMouseDown);

    if (this.bridge.appVersion.includes('-beta')) {
      this.showBetaWarning = storage.get(StorageKey.ShowBetaWarning) ?? true;
    } else {
      this.showBetaWarning = false;
    }

    makeObservable(this, {
      showBetaWarning: observable,
      isSessionsModalVisible: observable,

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
    this.unsubApp();
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
    document.removeEventListener('mousedown', this.onMouseDown);
    this.onVisibilityChange = undefined;
  }

  onMouseDown = (): void => {
    this.mouseUp = new Promise((resolve) => {
      document.addEventListener('mouseup', () => resolve(), { once: true });
    });
  };

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

  async openEditor(noteUuid: string): Promise<void> {
    if (this.getActiveEditor()?.note?.uuid === noteUuid) {
      return;
    }

    const note = this.application.findItem(noteUuid) as SNNote;
    if (!note) {
      console.warn('Tried accessing a non-existant note of UUID ' + noteUuid);
      return;
    }

    if (await this.application.authorizeNoteAccess(note)) {
      const activeEditor = this.getActiveEditor();
      if (!activeEditor) {
        this.application.editorGroup.createEditor(noteUuid);
      } else {
        activeEditor.setNote(note);
      }
      await this.notifyEvent(AppStateEvent.ActiveEditorChanged);
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
            } else if (note.trashed && !this.selectedTag?.isTrashTag) {
              this.closeEditor(editor);
            } else if (
              note.archived &&
              !this.selectedTag?.isArchiveTag &&
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
