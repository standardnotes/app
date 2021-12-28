import { Bridge } from '@/services/bridge';
import { storage, StorageKey } from '@/services/localStorage';
import { WebApplication } from '@/ui_models/application';
import { AccountMenuState } from '@/ui_models/app_state/account_menu_state';
import { NoteViewController } from '@/views/note_view/note_view_controller';
import { isDesktopApplication } from '@/utils';
import {
  ApplicationEvent,
  ContentType,
  DeinitSource,
  PayloadSource,
  PrefKey,
  SNNote,
  SNTag,
} from '@standardnotes/snjs';
import pull from 'lodash/pull';
import {
  action,
  computed,
  makeObservable,
  observable,
  runInAction,
} from 'mobx';
import { ActionsMenuState } from './actions_menu_state';
import { FeaturesState } from './features_state';
import { NotesState } from './notes_state';
import { NotesViewState } from './notes_view_state';
import { NoteTagsState } from './note_tags_state';
import { NoAccountWarningState } from './no_account_warning_state';
import { PreferencesState } from './preferences_state';
import { PurchaseFlowState } from './purchase_flow_state';
import { QuickSettingsState } from './quick_settings_state';
import { SearchOptionsState } from './search_options_state';
import { SyncState } from './sync_state';
import { TagsState } from './tags_state';

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
  readonly enableUnfinishedFeatures: boolean =
    window?._enable_unfinished_features;

  $rootScope: ng.IRootScopeService;
  $timeout: ng.ITimeoutService;
  application: WebApplication;
  observers: ObserverCallback[] = [];
  locked = true;
  unsubApp: any;
  rootScopeCleanup1: any;
  rootScopeCleanup2: any;
  onVisibilityChange: any;
  showBetaWarning: boolean;

  selectedTag: SNTag | undefined;
  previouslySelectedTag: SNTag | undefined;
  editingTag: SNTag | undefined;
  _templateTag: SNTag | undefined;

  private multiEditorSupport = false;

  readonly quickSettingsMenu = new QuickSettingsState();
  readonly accountMenu: AccountMenuState;
  readonly actionsMenu = new ActionsMenuState();
  readonly preferences = new PreferencesState();
  readonly purchaseFlow: PurchaseFlowState;
  readonly noAccountWarning: NoAccountWarningState;
  readonly noteTags: NoteTagsState;
  readonly sync = new SyncState();
  readonly searchOptions: SearchOptionsState;
  readonly notes: NotesState;
  readonly features: FeaturesState;
  readonly tags: TagsState;
  readonly notesView: NotesViewState;
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
    this.features = new FeaturesState(application);
    this.tags = new TagsState(
      application,
      this.appEventObserverRemovers,
      this.features
    );
    this.noAccountWarning = new NoAccountWarningState(
      application,
      this.appEventObserverRemovers
    );
    this.accountMenu = new AccountMenuState(
      application,
      this.appEventObserverRemovers
    );
    this.searchOptions = new SearchOptionsState(
      application,
      this.appEventObserverRemovers
    );
    this.purchaseFlow = new PurchaseFlowState(application);
    this.notesView = new NotesViewState(
      application,
      this,
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

    this.selectedTag = undefined;
    this.previouslySelectedTag = undefined;
    this.editingTag = undefined;
    this._templateTag = undefined;

    makeObservable(this, {
      showBetaWarning: observable,
      isSessionsModalVisible: observable,
      preferences: observable,

      selectedTag: observable,
      previouslySelectedTag: observable,
      _templateTag: observable,
      templateTag: computed,
      createNewTag: action,
      editingTag: observable,
      setSelectedTag: action,
      removeTag: action,

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
    this.features.deinit();
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

  openSessionsModal(): void {
    this.isSessionsModalVisible = true;
  }

  closeSessionsModal(): void {
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

  async openNewNote(title?: string) {
    if (!this.multiEditorSupport) {
      this.closeActiveNoteController();
    }
    const activeTagUuid = this.selectedTag
      ? this.selectedTag.isSmartTag
        ? undefined
        : this.selectedTag.uuid
      : undefined;

    await this.application.noteControllerGroup.createNoteView(
      undefined,
      title,
      activeTagUuid
    );
  }

  getActiveNoteController() {
    return this.application.noteControllerGroup.noteControllers[0];
  }

  getNoteControllers() {
    return this.application.noteControllerGroup.noteControllers;
  }

  closeNoteController(controller: NoteViewController) {
    this.application.noteControllerGroup.closeNoteView(controller);
  }

  closeActiveNoteController() {
    this.application.noteControllerGroup.closeActiveNoteView();
  }

  closeAllNoteControllers() {
    this.application.noteControllerGroup.closeAllNoteViews();
  }

  noteControllerForNote(note: SNNote) {
    for (const controller of this.getNoteControllers()) {
      if (controller.note.uuid === note.uuid) {
        return controller;
      }
    }
  }

  streamNotesAndTags() {
    this.application.streamItems(
      [ContentType.Note, ContentType.Tag],
      async (items, source) => {
        /** Close any note controllers for deleted/trashed/archived notes */
        if (source === PayloadSource.PreSyncSave) {
          const notes = items.filter(
            (candidate) => candidate.content_type === ContentType.Note
          ) as SNNote[];
          for (const note of notes) {
            const noteController = this.noteControllerForNote(note);
            if (!noteController) {
              continue;
            }
            if (note.deleted) {
              this.closeNoteController(noteController);
            } else if (
              note.trashed &&
              !this.selectedTag?.isTrashTag &&
              !this.searchOptions.includeTrashed
            ) {
              this.closeNoteController(noteController);
            } else if (
              note.archived &&
              !this.selectedTag?.isArchiveTag &&
              !this.searchOptions.includeArchived &&
              !this.application.getPreference(PrefKey.NotesShowArchived, false)
            ) {
              this.closeNoteController(noteController);
            }
          }
        }
        if (this.selectedTag) {
          const matchingTag = items.find(
            (candidate) =>
              this.selectedTag && candidate.uuid === this.selectedTag.uuid
          );
          if (matchingTag) {
            runInAction(() => {
              this.selectedTag = matchingTag as SNTag;
            });
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
          if (window.location.search.includes('purchase=true')) {
            this.purchaseFlow.openPurchaseFlow();
          }
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
    if (tag.conflictOf) {
      this.application.changeAndSaveItem(tag.uuid, (mutator) => {
        mutator.conflictOf = undefined;
      });
    }

    if (this.selectedTag === tag) {
      return;
    }

    this.previouslySelectedTag = this.selectedTag;
    this.selectedTag = tag;

    if (this.templateTag?.uuid === tag.uuid) {
      return;
    }

    this.notifyEvent(AppStateEvent.TagChanged, {
      tag: tag,
      previousTag: this.previouslySelectedTag,
    });
  }

  public getSelectedTag() {
    return this.selectedTag;
  }

  public get templateTag(): SNTag | undefined {
    return this._templateTag;
  }

  public set templateTag(tag: SNTag | undefined) {
    const previous = this._templateTag;
    this._templateTag = tag;

    if (tag) {
      this.setSelectedTag(tag);
      this.editingTag = tag;
    } else if (previous) {
      this.selectedTag =
        previous === this.selectedTag ? undefined : this.selectedTag;
      this.editingTag =
        previous === this.editingTag ? undefined : this.editingTag;
    }
  }

  public removeTag(tag: SNTag) {
    this.application.deleteItem(tag);
    this.setSelectedTag(this.tags.smartTags[0]);
  }

  public async createNewTag() {
    if (this.templateTag) {
      return;
    }

    const newTag = (await this.application.createTemplateItem(
      ContentType.Tag
    )) as SNTag;
    this.templateTag = newTag;
  }

  public async undoCreateNewTag() {
    const previousTag = this.previouslySelectedTag || this.tags.smartTags[0];
    this.setSelectedTag(previousTag);
  }

  /** Returns the tags that are referncing this note */
  public getNoteTags(note: SNNote) {
    return this.application.referencingForItem(note).filter((ref) => {
      return ref.content_type === ContentType.Tag;
    }) as SNTag[];
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
