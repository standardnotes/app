import { Bridge } from '@/services/bridge';
import { storage, StorageKey } from '@/services/localStorage';
import { WebApplication, WebAppEvent } from '@/ui_models/application';
import { AccountMenuState } from '@/ui_models/app_state/account_menu_state';
import { isDesktopApplication } from '@/utils';
import {
  ApplicationEvent,
  ContentType,
  DeinitSource,
  NoteViewController,
  PayloadSource,
  PrefKey,
  SNNote,
  SmartView,
  SNTag,
  SystemViewId,
} from '@standardnotes/snjs';
import pull from 'lodash/pull';
import {
  action,
  computed,
  IReactionDisposer,
  makeObservable,
  observable,
  reaction,
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
import { SubscriptionState } from './subscription_state';
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
    window?.enabledUnfinishedFeatures;

  application: WebApplication;
  observers: ObserverCallback[] = [];
  locked = true;
  unsubApp: any;
  webAppEventDisposer?: () => void;
  onVisibilityChange: any;
  showBetaWarning: boolean;

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
  readonly subscription: SubscriptionState;

  isSessionsModalVisible = false;

  private appEventObserverRemovers: (() => void)[] = [];

  private readonly tagChangedDisposer: IReactionDisposer;

  constructor(application: WebApplication, private bridge: Bridge) {
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
    this.subscription = new SubscriptionState(
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

    makeObservable(this, {
      selectedTag: computed,

      showBetaWarning: observable,
      isSessionsModalVisible: observable,
      preferences: observable,

      enableBetaWarning: action,
      disableBetaWarning: action,
      openSessionsModal: action,
      closeSessionsModal: action,
    });

    this.tagChangedDisposer = this.tagChangedNotifier();
  }

  deinit(source: DeinitSource): void {
    if (source === DeinitSource.SignOut) {
      storage.remove(StorageKey.ShowBetaWarning);
      this.noAccountWarning.reset();
    }
    (this.application as unknown) = undefined;
    this.actionsMenu.reset();
    this.unsubApp?.();
    this.unsubApp = undefined;
    this.observers.length = 0;

    this.appEventObserverRemovers.forEach((remover) => remover());
    this.appEventObserverRemovers.length = 0;

    this.features.deinit();
    (this.features as unknown) = undefined;

    this.webAppEventDisposer?.();
    this.webAppEventDisposer = undefined;

    (this.quickSettingsMenu as unknown) = undefined;
    (this.accountMenu as unknown) = undefined;
    (this.actionsMenu as unknown) = undefined;
    (this.preferences as unknown) = undefined;
    (this.purchaseFlow as unknown) = undefined;
    (this.noteTags as unknown) = undefined;
    (this.sync as unknown) = undefined;
    (this.searchOptions as unknown) = undefined;
    (this.notes as unknown) = undefined;
    (this.features as unknown) = undefined;
    (this.tags as unknown) = undefined;
    (this.notesView as unknown) = undefined;

    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.onVisibilityChange = undefined;

    this.tagChangedDisposer();
    (this.tagChangedDisposer as unknown) = undefined;
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

  public get version(): string {
    return this.bridge.appVersion;
  }

  async openNewNote(title?: string) {
    if (!this.multiEditorSupport) {
      this.closeActiveNoteController();
    }

    const selectedTag = this.selectedTag;

    const activeRegularTagUuid =
      selectedTag && selectedTag instanceof SNTag
        ? selectedTag.uuid
        : undefined;

    await this.application.noteControllerGroup.createNoteView(
      undefined,
      title,
      activeRegularTagUuid
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

  isGlobalSpellcheckEnabled(): boolean {
    return this.application.getPreference(PrefKey.EditorSpellcheck, true);
  }

  async toggleGlobalSpellcheck() {
    const currentValue = this.isGlobalSpellcheckEnabled();
    return this.application.setPreference(
      PrefKey.EditorSpellcheck,
      !currentValue
    );
  }

  private tagChangedNotifier(): IReactionDisposer {
    return reaction(
      () => this.tags.selectedUuid,
      () => {
        const tag = this.tags.selected;
        const previousTag = this.tags.previouslySelected;

        if (!tag) {
          return;
        }

        if (this.application.isTemplateItem(tag)) {
          return;
        }

        this.notifyEvent(AppStateEvent.TagChanged, {
          tag,
          previousTag,
        });
      }
    );
  }

  public get selectedTag(): SNTag | SmartView | undefined {
    return this.tags.selected;
  }

  public set selectedTag(tag: SNTag | SmartView | undefined) {
    this.tags.selected = tag;
  }

  streamNotesAndTags() {
    this.application.streamItems(
      [ContentType.Note, ContentType.Tag],
      async (items, source) => {
        const selectedTag = this.tags.selected;

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
              !(
                selectedTag instanceof SmartView &&
                selectedTag.uuid === SystemViewId.TrashedNotes
              ) &&
              !this.searchOptions.includeTrashed
            ) {
              this.closeNoteController(noteController);
            } else if (
              note.archived &&
              !(
                selectedTag instanceof SmartView &&
                selectedTag.uuid === SystemViewId.ArchivedNotes
              ) &&
              !this.searchOptions.includeArchived &&
              !this.application.getPreference(PrefKey.NotesShowArchived, false)
            ) {
              this.closeNoteController(noteController);
            }
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
      this.webAppEventDisposer = this.application.addWebEventObserver(
        (event) => {
          if (event === WebAppEvent.DesktopWindowGainedFocus) {
            this.notifyEvent(AppStateEvent.WindowDidFocus);
          } else if (event === WebAppEvent.DesktopWindowLostFocus) {
            this.notifyEvent(AppStateEvent.WindowDidBlur);
          }
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
     * Timeout is particularly important so we can give all initial
     * controllers a chance to construct before propogting any events *
     */
    return new Promise<void>((resolve) => {
      setTimeout(async () => {
        for (const callback of this.observers) {
          await callback(eventName, data);
        }
        resolve();
      });
    });
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
