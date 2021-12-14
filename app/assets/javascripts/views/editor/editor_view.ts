import { STRING_SAVING_WHILE_DOCUMENT_HIDDEN } from './../../strings';
import { Editor } from '@/ui_models/editor';
import { WebApplication } from '@/ui_models/application';
import { PanelPuppet, WebDirective } from '@/types';
import angular from 'angular';
import {
  ApplicationEvent,
  isPayloadSourceRetrieved,
  isPayloadSourceInternalChange,
  ContentType,
  SNComponent,
  SNNote,
  NoteMutator,
  Uuids,
  ComponentArea,
  PrefKey,
  ComponentMutator,
  PayloadSource,
  ProposedSecondsToDeferUILevelSessionExpirationDuringActiveInteraction,
} from '@standardnotes/snjs';
import { isDesktopApplication } from '@/utils';
import { KeyboardModifier, KeyboardKey } from '@/services/ioService';
import template from './editor-view.pug';
import { PureViewCtrl } from '@Views/abstract/pure_view_ctrl';
import { EventSource } from '@/ui_models/app_state';
import {
  STRING_DELETED_NOTE,
  STRING_INVALID_NOTE,
  STRING_ELLIPSES,
  STRING_DELETE_PLACEHOLDER_ATTEMPT,
  STRING_DELETE_LOCKED_ATTEMPT,
  STRING_EDIT_LOCKED_ATTEMPT,
  StringDeleteNote,
} from '@/strings';
import { confirmDialog } from '@/services/alertService';

const NOTE_PREVIEW_CHAR_LIMIT = 80;
const MINIMUM_STATUS_DURATION = 400;
const SAVE_TIMEOUT_DEBOUNCE = 350;
const SAVE_TIMEOUT_NO_DEBOUNCE = 100;
const EDITOR_DEBOUNCE = 100;

const ElementIds = {
  NoteTextEditor: 'note-text-editor',
  NoteTitleEditor: 'note-title-editor',
  EditorContent: 'editor-content',
};

type NoteStatus = {
  message?: string;
  desc?: string;
};

type EditorState = {
  stackComponents: SNComponent[];
  editorComponent?: SNComponent;
  saveError?: any;
  noteStatus?: NoteStatus;
  marginResizersEnabled?: boolean;
  monospaceFont?: boolean;
  isDesktop?: boolean;
  syncTakingTooLong: boolean;
  showActionsMenu: boolean;
  showEditorMenu: boolean;
  showHistoryMenu: boolean;
  spellcheck: boolean;
  /**
   * Setting to false then true will allow the current editor component-view to be destroyed
   * then re-initialized. Used when changing between component editors.
   */
  editorUnloading: boolean;
  /** Setting to true then false will allow the main content textarea to be destroyed
   * then re-initialized. Used when reloading spellcheck status. */
  textareaUnloading: boolean;
  showProtectedWarning: boolean;
};

type EditorValues = {
  title: string;
  text: string;
};

function copyEditorValues(values: EditorValues) {
  return Object.assign({}, values);
}

function sortAlphabetically(array: SNComponent[]): SNComponent[] {
  return array.sort((a, b) =>
    a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1
  );
}

export class EditorViewCtrl extends PureViewCtrl<unknown, EditorState> {
  /** Passed through template */
  readonly application!: WebApplication;
  readonly editor!: Editor;

  private leftPanelPuppet?: PanelPuppet;
  private rightPanelPuppet?: PanelPuppet;
  private unregisterComponent: any;
  private saveTimeout?: ng.IPromise<void>;
  private statusTimeout?: ng.IPromise<void>;
  private lastEditorFocusEventSource?: EventSource;
  public editorValues: EditorValues = { title: '', text: '' };
  onEditorLoad?: () => void;

  private scrollPosition = 0;
  private removeTrashKeyObserver?: any;
  private removeTabObserver?: any;

  private removeComponentsObserver!: () => void;
  private protectionTimeoutId: ReturnType<typeof setTimeout> | null = null;
  public requireAuthenticationForProtectedNote = false;

  /* @ngInject */
  constructor($timeout: ng.ITimeoutService) {
    super($timeout);
    this.leftPanelPuppet = {
      onReady: () => this.reloadPreferences(),
    };
    this.rightPanelPuppet = {
      onReady: () => this.reloadPreferences(),
    };

    this.editorMenuOnSelect = this.editorMenuOnSelect.bind(this);
    this.onPanelResizeFinish = this.onPanelResizeFinish.bind(this);
    this.setScrollPosition = this.setScrollPosition.bind(this);
    this.resetScrollPosition = this.resetScrollPosition.bind(this);
    this.onEditorLoad = () => {
      this.application.getDesktopService().redoSearch();
    };
  }

  deinit() {
    this.clearNoteProtectionInactivityTimer();
    this.editor.clearNoteChangeListener();
    this.removeComponentsObserver();
    (this.removeComponentsObserver as unknown) = undefined;
    this.removeTrashKeyObserver();
    this.removeTrashKeyObserver = undefined;
    this.removeTabObserver && this.removeTabObserver();
    this.removeTabObserver = undefined;
    this.leftPanelPuppet = undefined;
    this.rightPanelPuppet = undefined;
    this.onEditorLoad = undefined;
    this.unregisterComponent();
    this.unregisterComponent = undefined;
    this.saveTimeout = undefined;
    this.statusTimeout = undefined;
    (this.onPanelResizeFinish as unknown) = undefined;
    (this.editorMenuOnSelect as unknown) = undefined;
    super.deinit();
  }

  getState() {
    return this.state as EditorState;
  }

  get note() {
    return this.editor.note;
  }

  $onInit() {
    super.$onInit();
    this.registerKeyboardShortcuts();
    this.editor.onNoteChange(() => {
      this.handleEditorNoteChange();
    });
    this.editor.onNoteValueChange((note, source) => {
      if (isPayloadSourceRetrieved(source!)) {
        this.editorValues.title = note.title;
        this.editorValues.text = note.text;
      }
      if (!this.editorValues.title) {
        this.editorValues.title = note.title;
      }
      if (!this.editorValues.text) {
        this.editorValues.text = note.text;
      }

      const isTemplateNoteInsertedToBeInteractableWithEditor =
        source === PayloadSource.Constructor && note.dirty;
      if (isTemplateNoteInsertedToBeInteractableWithEditor) {
        return;
      }

      if (note.lastSyncBegan || note.dirty) {
        if (note.lastSyncEnd) {
          if (
            note.dirty ||
            note.lastSyncBegan!.getTime() > note.lastSyncEnd!.getTime()
          ) {
            this.showSavingStatus();
          } else if (
            note.lastSyncEnd!.getTime() > note.lastSyncBegan!.getTime()
          ) {
            this.showAllChangesSavedStatus();
          }
        } else {
          this.showSavingStatus();
        }
      }
    });
    this.autorun(() => {
      this.setState({
        showProtectedWarning: this.appState.notes.showProtectedWarning,
      });
    });
  }

  /** @override */
  getInitialState() {
    return {
      stackComponents: [],
      editorDebounce: EDITOR_DEBOUNCE,
      isDesktop: isDesktopApplication(),
      spellcheck: true,
      syncTakingTooLong: false,
      showActionsMenu: false,
      showEditorMenu: false,
      showHistoryMenu: false,
      noteStatus: undefined,
      editorUnloading: false,
      textareaUnloading: false,
      showProtectedWarning: false,
    } as EditorState;
  }

  async onAppLaunch() {
    await super.onAppLaunch();
    this.streamItems();
    this.registerComponentHandler();
  }

  /** @override */
  async onAppEvent(eventName: ApplicationEvent) {
    switch (eventName) {
      case ApplicationEvent.PreferencesChanged:
        this.reloadPreferences();
        break;
      case ApplicationEvent.HighLatencySync:
        this.setState({ syncTakingTooLong: true });
        break;
      case ApplicationEvent.CompletedFullSync: {
        this.setState({ syncTakingTooLong: false });
        const isInErrorState = this.state.saveError;
        /** if we're still dirty, don't change status, a sync is likely upcoming. */
        if (!this.note.dirty && isInErrorState) {
          this.showAllChangesSavedStatus();
        }
        break;
      }
      case ApplicationEvent.FailedSync:
        /**
         * Only show error status in editor if the note is dirty.
         * Otherwise, it means the originating sync came from somewhere else
         * and we don't want to display an error here.
         */
        if (this.note.dirty) {
          this.showErrorStatus();
        }
        break;
      case ApplicationEvent.LocalDatabaseWriteError:
        this.showErrorStatus({
          message: 'Offline Saving Issue',
          desc: 'Changes not saved',
        });
        break;
      case ApplicationEvent.UnprotectedSessionBegan: {
        this.setShowProtectedWarning(false);
        break;
      }
      case ApplicationEvent.UnprotectedSessionExpired: {
        if (this.note.protected) {
          this.hideProtectedNoteIfInactive();
        }
        break;
      }
    }
  }

  getSecondsElapsedSinceLastEdit(): number {
    return (Date.now() - this.note.userModifiedDate.getTime()) / 1000;
  }

  hideProtectedNoteIfInactive(): void {
    const secondsElapsedSinceLastEdit = this.getSecondsElapsedSinceLastEdit();
    if (
      secondsElapsedSinceLastEdit >=
      ProposedSecondsToDeferUILevelSessionExpirationDuringActiveInteraction
    ) {
      this.setShowProtectedWarning(true);
    } else {
      const secondsUntilTheNextCheck =
        ProposedSecondsToDeferUILevelSessionExpirationDuringActiveInteraction -
        secondsElapsedSinceLastEdit;
      this.startNoteProtectionInactivityTimer(secondsUntilTheNextCheck);
    }
  }

  startNoteProtectionInactivityTimer(timerDurationInSeconds: number): void {
    this.clearNoteProtectionInactivityTimer();
    this.protectionTimeoutId = setTimeout(() => {
      this.hideProtectedNoteIfInactive();
    }, timerDurationInSeconds * 1000);
  }

  clearNoteProtectionInactivityTimer(): void {
    if (this.protectionTimeoutId) {
      clearTimeout(this.protectionTimeoutId);
    }
  }

  async handleEditorNoteChange() {
    this.clearNoteProtectionInactivityTimer();
    this.cancelPendingSetStatus();
    const note = this.editor.note;

    const showProtectedWarning =
      note.protected &&
      (!this.application.hasProtectionSources() ||
        this.application.getProtectionSessionExpiryDate().getTime() <
          Date.now());
    this.requireAuthenticationForProtectedNote =
      note.protected && this.application.hasProtectionSources();

    this.setShowProtectedWarning(showProtectedWarning);
    await this.setState({
      showActionsMenu: false,
      showEditorMenu: false,
      showHistoryMenu: false,
      noteStatus: undefined,
    });
    this.editorValues.title = note.title;
    this.editorValues.text = note.text;
    this.reloadEditor();
    this.reloadPreferences();
    this.reloadStackComponents();
    if (note.dirty) {
      this.showSavingStatus();
    }
  }

  async dismissProtectedWarning() {
    let showNoteContents = true;
    if (this.application.hasProtectionSources()) {
      showNoteContents = await this.application.authorizeNoteAccess(this.note);
    }
    if (!showNoteContents) {
      return;
    }
    this.setShowProtectedWarning(false);
    this.focusTitle();
  }

  /**
   * Because note.locked accesses note.content.appData,
   * we do not want to expose the template to direct access to note.locked,
   * otherwise an exception will occur when trying to access note.locked if the note
   * is deleted. There is potential for race conditions to occur with setState, where a
   * previous setState call may have queued a digest cycle, and the digest cycle triggers
   * on a deleted note.
   */
  get noteLocked() {
    if (!this.note || this.note.deleted) {
      return false;
    }
    return this.note.locked;
  }

  streamItems() {
    this.removeComponentsObserver = this.application.streamItems(
      ContentType.Component,
      async (_items, source) => {
        if (isPayloadSourceInternalChange(source!)) {
          return;
        }
        if (!this.note) return;
        this.reloadStackComponents();
        this.reloadEditor();
      }
    );
  }

  private async reloadEditor() {
    const newEditor = this.application.componentManager.editorForNote(
      this.note
    );
    /** Editors cannot interact with template notes so the note must be inserted */
    if (newEditor && this.editor.isTemplateNote) {
      await this.editor.insertTemplatedNote();
    }
    const currentEditor = this.state.editorComponent;
    if (currentEditor?.uuid !== newEditor?.uuid) {
      await this.setState({
        /** Unload current component view so that we create a new one */
        editorUnloading: true,
      });
      await this.setState({
        /** Reload component view */
        editorComponent: newEditor,
        editorUnloading: false,
      });
      this.reloadFont();
    }
    this.application.componentManager.contextItemDidChangeInArea(
      ComponentArea.Editor
    );
  }

  setMenuState(menu: string, state: boolean) {
    this.setState({
      [menu]: state,
    });
    this.closeAllMenus(menu);
  }

  toggleMenu(menu: keyof EditorState) {
    this.setMenuState(menu, !this.state[menu]);
    this.application.getAppState().notes.setContextMenuOpen(false);
  }

  closeAllMenus(exclude?: string) {
    const allMenus = ['showEditorMenu', 'showActionsMenu', 'showHistoryMenu'];
    const menuState: any = {};
    for (const candidate of allMenus) {
      if (candidate !== exclude) {
        menuState[candidate] = false;
      }
    }
    this.setState(menuState);
  }

  async editorMenuOnSelect(component?: SNComponent) {
    this.setMenuState('showEditorMenu', false);
    if (this.appState.getActiveEditor()?.isTemplateNote) {
      await this.appState.getActiveEditor().insertTemplatedNote();
    }
    if (this.note.locked) {
      this.application.alertService.alert(STRING_EDIT_LOCKED_ATTEMPT);
      return;
    }
    if (!component) {
      if (!this.note.prefersPlainEditor) {
        await this.application.changeItem(this.note.uuid, (mutator) => {
          const noteMutator = mutator as NoteMutator;
          noteMutator.prefersPlainEditor = true;
        });
        this.reloadEditor();
      }
      if (
        this.state.editorComponent?.isExplicitlyEnabledForItem(this.note.uuid)
      ) {
        await this.disassociateComponentWithCurrentNote(
          this.state.editorComponent
        );
      }
      this.reloadFont();
    } else if (component.area === ComponentArea.Editor) {
      const currentEditor = this.state.editorComponent;
      if (currentEditor && component.uuid !== currentEditor.uuid) {
        await this.disassociateComponentWithCurrentNote(currentEditor);
      }
      const prefersPlain = this.note.prefersPlainEditor;
      if (prefersPlain) {
        await this.application.changeItem(this.note.uuid, (mutator) => {
          const noteMutator = mutator as NoteMutator;
          noteMutator.prefersPlainEditor = false;
        });
      }
      await this.associateComponentWithCurrentNote(component);
    } else if (component.area === ComponentArea.EditorStack) {
      await this.toggleStackComponentForCurrentItem(component);
    }
    /** Dirtying can happen above */
    this.application.sync();
  }

  hasAvailableExtensions() {
    return (
      this.application.actionsManager!.extensionsInContextOfItem(this.note)
        .length > 0
    );
  }

  /**
   * @param bypassDebouncer Calling save will debounce by default. You can pass true to save
   * immediately.
   * @param isUserModified This field determines if the item will be saved as a user
   * modification, thus updating the user modified date displayed in the UI
   * @param dontUpdatePreviews Whether this change should update the note's plain and HTML
   * preview.
   * @param customMutate A custom mutator function.
   * @param closeAfterSync Whether this editor should be closed after the sync starts.
   * This allows us to make a destructive change, wait for sync to be triggered, then
   * close the editor (if we closed the editor before sync began, we'd get an exception,
   * since the debouncer will be triggered on a non-existent editor)
   */
  async save(
    note: SNNote,
    editorValues: EditorValues,
    bypassDebouncer = false,
    isUserModified = false,
    dontUpdatePreviews = false,
    customMutate?: (mutator: NoteMutator) => void,
    closeAfterSync = false
  ) {
    const title = editorValues.title;
    const text = editorValues.text;
    const isTemplate = this.editor.isTemplateNote;
    if (document.hidden) {
      this.application.alertService.alert(STRING_SAVING_WHILE_DOCUMENT_HIDDEN);
      return;
    }
    if (note.deleted) {
      this.application.alertService.alert(STRING_DELETED_NOTE);
      return;
    }
    if (isTemplate) {
      await this.editor.insertTemplatedNote();
    }
    if (!this.application.findItem(note.uuid)) {
      this.application.alertService.alert(STRING_INVALID_NOTE);
      return;
    }
    await this.application.changeItem(
      note.uuid,
      (mutator) => {
        const noteMutator = mutator as NoteMutator;
        if (customMutate) {
          customMutate(noteMutator);
        }
        noteMutator.title = title;
        noteMutator.text = text;
        if (!dontUpdatePreviews) {
          const noteText = text || '';
          const truncate = noteText.length > NOTE_PREVIEW_CHAR_LIMIT;
          const substring = noteText.substring(0, NOTE_PREVIEW_CHAR_LIMIT);
          const previewPlain = substring + (truncate ? STRING_ELLIPSES : '');
          noteMutator.preview_plain = previewPlain;
          noteMutator.preview_html = undefined;
        }
      },
      isUserModified
    );
    if (this.saveTimeout) {
      this.$timeout.cancel(this.saveTimeout);
    }
    const noDebounce = bypassDebouncer || this.application.noAccount();
    const syncDebouceMs = noDebounce
      ? SAVE_TIMEOUT_NO_DEBOUNCE
      : SAVE_TIMEOUT_DEBOUNCE;
    this.saveTimeout = this.$timeout(() => {
      this.application.sync();
      if (closeAfterSync) {
        this.appState.closeEditor(this.editor);
      }
    }, syncDebouceMs);
  }

  showSavingStatus() {
    this.setStatus({ message: 'Saving…' }, false);
  }

  showAllChangesSavedStatus() {
    this.setState({
      saveError: false,
      syncTakingTooLong: false,
    });
    this.setStatus({
      message:
        'All changes saved' + (this.application.noAccount() ? ' offline' : ''),
    });
  }

  showErrorStatus(error?: NoteStatus) {
    if (!error) {
      error = {
        message: 'Sync Unreachable',
        desc: 'Changes saved offline',
      };
    }
    this.setState({
      saveError: true,
      syncTakingTooLong: false,
    });
    this.setStatus(error);
  }

  setStatus(status: NoteStatus, wait = true) {
    if (this.statusTimeout) {
      this.$timeout.cancel(this.statusTimeout);
    }
    if (wait) {
      this.statusTimeout = this.$timeout(() => {
        this.setState({
          noteStatus: status,
        });
      }, MINIMUM_STATUS_DURATION);
    } else {
      this.setState({
        noteStatus: status,
      });
    }
  }

  cancelPendingSetStatus() {
    if (this.statusTimeout) {
      this.$timeout.cancel(this.statusTimeout);
    }
  }

  contentChanged() {
    this.save(this.note, copyEditorValues(this.editorValues), false, true);
  }

  onTitleEnter($event: Event) {
    ($event.target as HTMLInputElement).blur();
    this.onTitleChange();
    this.focusEditor();
  }

  onTitleChange() {
    this.save(
      this.note,
      copyEditorValues(this.editorValues),
      false,
      true,
      true
    );
  }

  focusEditor() {
    const element = document.getElementById(ElementIds.NoteTextEditor);
    if (element) {
      this.lastEditorFocusEventSource = EventSource.Script;
      element.focus();
    }
  }

  focusTitle() {
    document.getElementById(ElementIds.NoteTitleEditor)?.focus();
  }

  clickedTextArea() {
    this.closeAllMenus();
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onTitleFocus() {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onTitleBlur() {}

  onContentFocus() {
    this.application
      .getAppState()
      .editorDidFocus(this.lastEditorFocusEventSource!);
    this.lastEditorFocusEventSource = undefined;
  }

  setShowProtectedWarning(show: boolean) {
    this.appState.notes.setShowProtectedWarning(show);
  }

  async deleteNote(permanently: boolean) {
    if (this.editor.isTemplateNote) {
      this.application.alertService!.alert(STRING_DELETE_PLACEHOLDER_ATTEMPT);
      return;
    }
    if (this.note.locked) {
      this.application.alertService!.alert(STRING_DELETE_LOCKED_ATTEMPT);
      return;
    }
    const title = this.note.safeTitle().length
      ? `'${this.note.title}'`
      : 'this note';
    const text = StringDeleteNote(title, permanently);
    if (
      await confirmDialog({
        text,
        confirmButtonStyle: 'danger',
      })
    ) {
      if (permanently) {
        this.performNoteDeletion(this.note);
      } else {
        this.save(
          this.note,
          copyEditorValues(this.editorValues),
          true,
          false,
          true,
          (mutator) => {
            mutator.trashed = true;
          }
        );
      }
    }
  }

  performNoteDeletion(note: SNNote) {
    this.application.deleteItem(note);
  }

  async onPanelResizeFinish(width: number, left: number, isMaxWidth: boolean) {
    if (isMaxWidth) {
      await this.application.setPreference(PrefKey.EditorWidth, null);
    } else {
      if (width !== undefined && width !== null) {
        await this.application.setPreference(PrefKey.EditorWidth, width);
        this.leftPanelPuppet!.setWidth!(width);
      }
    }
    if (left !== undefined && left !== null) {
      await this.application.setPreference(PrefKey.EditorLeft, left);
      this.rightPanelPuppet!.setLeft!(left);
    }
    this.application.sync();
  }

  async reloadPreferences() {
    const monospaceFont = this.application.getPreference(
      PrefKey.EditorMonospaceEnabled,
      true
    );
    const spellcheck = this.application.getPreference(
      PrefKey.EditorSpellcheck,
      true
    );
    const marginResizersEnabled = this.application.getPreference(
      PrefKey.EditorResizersEnabled,
      true
    );

    if (spellcheck !== this.state.spellcheck) {
      await this.setState({ textareaUnloading: true });
      await this.setState({ textareaUnloading: false });
      this.reloadFont();
    }

    await this.setState({
      monospaceFont,
      spellcheck,
      marginResizersEnabled,
    });

    if (!document.getElementById(ElementIds.EditorContent)) {
      /** Elements have not yet loaded due to ng-if around wrapper */
      return;
    }

    this.reloadFont();

    if (
      this.state.marginResizersEnabled &&
      this.leftPanelPuppet?.ready &&
      this.rightPanelPuppet?.ready
    ) {
      const width = this.application.getPreference(PrefKey.EditorWidth, null);
      if (width != null) {
        this.leftPanelPuppet!.setWidth!(width);
        this.rightPanelPuppet!.setWidth!(width);
      }
      const left = this.application.getPreference(PrefKey.EditorLeft, null);
      if (left != null) {
        this.leftPanelPuppet!.setLeft!(left);
        this.rightPanelPuppet!.setLeft!(left);
      }
    }
  }

  reloadFont() {
    const root = document.querySelector(':root') as HTMLElement;
    const propertyName = '--sn-stylekit-editor-font-family';
    if (this.state.monospaceFont) {
      root.style.setProperty(propertyName, 'var(--sn-stylekit-monospace-font)');
    } else {
      root.style.setProperty(
        propertyName,
        'var(--sn-stylekit-sans-serif-font)'
      );
    }
  }

  /** @components */

  registerComponentHandler() {
    this.unregisterComponent =
      this.application.componentManager.registerHandler({
        identifier: 'editor',
        areas: [ComponentArea.EditorStack, ComponentArea.Editor],
        contextRequestHandler: (componentUuid) => {
          const currentEditor = this.state.editorComponent;
          if (
            componentUuid === currentEditor?.uuid ||
            Uuids(this.state.stackComponents).includes(componentUuid)
          ) {
            return this.note;
          }
        },
        focusHandler: (component, focused) => {
          if (component.isEditor() && focused) {
            this.closeAllMenus();
          }
        },
      });
  }

  async reloadStackComponents() {
    const stackComponents = sortAlphabetically(
      this.application.componentManager
        .componentsForArea(ComponentArea.EditorStack)
        .filter((component) => component.active)
    );
    if (this.note) {
      for (const component of stackComponents) {
        if (component.active) {
          this.application.componentManager.setComponentHidden(
            component,
            !component.isExplicitlyEnabledForItem(this.note.uuid)
          );
        }
      }
    }
    await this.setState({ stackComponents });
    this.application.componentManager.contextItemDidChangeInArea(
      ComponentArea.EditorStack
    );
  }

  stackComponentHidden(component: SNComponent) {
    return this.application.componentManager?.isComponentHidden(component);
  }

  async toggleStackComponentForCurrentItem(component: SNComponent) {
    const hidden =
      this.application.componentManager.isComponentHidden(component);
    if (hidden || !component.active) {
      this.application.componentManager.setComponentHidden(component, false);
      await this.associateComponentWithCurrentNote(component);
      this.application.componentManager.contextItemDidChangeInArea(
        ComponentArea.EditorStack
      );
    } else {
      this.application.componentManager.setComponentHidden(component, true);
      await this.disassociateComponentWithCurrentNote(component);
    }
    this.application.sync();
  }

  async disassociateComponentWithCurrentNote(component: SNComponent) {
    const note = this.note;
    return this.application.changeItem(component.uuid, (m) => {
      const mutator = m as ComponentMutator;
      mutator.removeAssociatedItemId(note.uuid);
      mutator.disassociateWithItem(note.uuid);
    });
  }

  async associateComponentWithCurrentNote(component: SNComponent) {
    const note = this.note;
    return this.application.changeItem(component.uuid, (m) => {
      const mutator = m as ComponentMutator;
      mutator.removeDisassociatedItemId(note.uuid);
      mutator.associateWithItem(note.uuid);
    });
  }

  registerKeyboardShortcuts() {
    this.removeTrashKeyObserver = this.application.io.addKeyObserver({
      key: KeyboardKey.Backspace,
      notTags: ['INPUT', 'TEXTAREA'],
      modifiers: [KeyboardModifier.Meta],
      onKeyDown: () => {
        this.deleteNote(false);
      },
    });
  }

  setScrollPosition() {
    const editor = document.getElementById(
      ElementIds.NoteTextEditor
    ) as HTMLInputElement;
    this.scrollPosition = editor.scrollTop;
  }

  resetScrollPosition() {
    const editor = document.getElementById(
      ElementIds.NoteTextEditor
    ) as HTMLInputElement;
    editor.scrollTop = this.scrollPosition;
  }

  onSystemEditorLoad() {
    if (this.removeTabObserver) {
      return;
    }
    /**
     * Insert 4 spaces when a tab key is pressed,
     * only used when inside of the text editor.
     * If the shift key is pressed first, this event is
     * not fired.
     */
    const editor = document.getElementById(
      ElementIds.NoteTextEditor
    )! as HTMLInputElement;
    this.removeTabObserver = this.application.io.addKeyObserver({
      element: editor,
      key: KeyboardKey.Tab,
      onKeyDown: (event) => {
        if (document.hidden || this.note.locked || event.shiftKey) {
          return;
        }
        event.preventDefault();
        /** Using document.execCommand gives us undo support */
        const insertSuccessful = document.execCommand(
          'insertText',
          false,
          '\t'
        );
        if (!insertSuccessful) {
          /** document.execCommand works great on Chrome/Safari but not Firefox */
          const start = editor.selectionStart!;
          const end = editor.selectionEnd!;
          const spaces = '    ';
          /** Insert 4 spaces */
          editor.value =
            editor.value.substring(0, start) +
            spaces +
            editor.value.substring(end);
          /** Place cursor 4 spaces away from where the tab key was pressed */
          editor.selectionStart = editor.selectionEnd = start + 4;
        }
        this.editorValues.text = editor.value;
        this.save(this.note, copyEditorValues(this.editorValues), true);
      },
    });

    editor.addEventListener('scroll', this.setScrollPosition);
    editor.addEventListener('input', this.resetScrollPosition);

    /**
     * Handles when the editor is destroyed,
     * (and not when our controller is destroyed.)
     */
    angular.element(editor).one('$destroy', () => {
      this.removeTabObserver?.();
      this.removeTabObserver = undefined;
      editor.removeEventListener('scroll', this.setScrollPosition);
      editor.removeEventListener('scroll', this.resetScrollPosition);
      this.scrollPosition = 0;
    });
  }
}

export class EditorView extends WebDirective {
  constructor() {
    super();
    this.restrict = 'E';
    this.scope = {
      editor: '=',
      application: '=',
    };
    this.template = template;
    this.replace = true;
    this.controller = EditorViewCtrl;
    this.controllerAs = 'self';
    this.bindToController = true;
  }
}
