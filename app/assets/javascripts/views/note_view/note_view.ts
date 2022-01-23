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
  ComponentArea,
  PrefKey,
  ComponentMutator,
  PayloadSource,
  ComponentViewer,
  ComponentManagerEvent,
  TransactionalMutation,
  ItemMutator,
  ProposedSecondsToDeferUILevelSessionExpirationDuringActiveInteraction,
  NoteViewController,
} from '@standardnotes/snjs';
import { debounce, isDesktopApplication } from '@/utils';
import { KeyboardModifier, KeyboardKey } from '@/services/ioService';
import template from './note-view.pug';
import { PureViewCtrl } from '@Views/abstract/pure_view_ctrl';
import { EventSource } from '@/ui_models/app_state';
import {
  STRING_DELETE_PLACEHOLDER_ATTEMPT,
  STRING_DELETE_LOCKED_ATTEMPT,
  StringDeleteNote,
} from '@/strings';
import { confirmDialog } from '@/services/alertService';

const MINIMUM_STATUS_DURATION = 400;
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
  availableStackComponents: SNComponent[];
  stackComponentViewers: ComponentViewer[];
  editorComponentViewer?: ComponentViewer;
  editorStateDidLoad: boolean;
  saveError?: any;
  noteStatus?: NoteStatus;
  marginResizersEnabled?: boolean;
  monospaceFont?: boolean;
  isDesktop?: boolean;
  syncTakingTooLong: boolean;
  showActionsMenu: boolean;
  showHistoryMenu: boolean;
  spellcheck: boolean;
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

export const transactionForAssociateComponentWithCurrentNote = (
  component: SNComponent,
  note: SNNote
) => {
  const transaction: TransactionalMutation = {
    itemUuid: component.uuid,
    mutate: (m: ItemMutator) => {
      const mutator = m as ComponentMutator;
      mutator.removeDisassociatedItemId(note.uuid);
      mutator.associateWithItem(note.uuid);
    },
  };
  return transaction;
};

export const transactionForDisassociateComponentWithCurrentNote = (
  component: SNComponent,
  note: SNNote
) => {
  const transaction: TransactionalMutation = {
    itemUuid: component.uuid,
    mutate: (m: ItemMutator) => {
      const mutator = m as ComponentMutator;
      mutator.removeAssociatedItemId(note.uuid);
      mutator.disassociateWithItem(note.uuid);
    },
  };
  return transaction;
};

export const reloadFont = (monospaceFont?: boolean) => {
  const root = document.querySelector(':root') as HTMLElement;
  const propertyName = '--sn-stylekit-editor-font-family';
  if (monospaceFont) {
    root.style.setProperty(propertyName, 'var(--sn-stylekit-monospace-font)');
  } else {
    root.style.setProperty(propertyName, 'var(--sn-stylekit-sans-serif-font)');
  }
};

export class NoteView extends PureViewCtrl<unknown, EditorState> {
  /** Passed through template */
  readonly application!: WebApplication;
  readonly controller!: NoteViewController;

  private leftPanelPuppet?: PanelPuppet;
  private rightPanelPuppet?: PanelPuppet;
  private statusTimeout?: ng.IPromise<void>;
  private lastEditorFocusEventSource?: EventSource;
  public editorValues: EditorValues = { title: '', text: '' };
  onEditorComponentLoad?: () => void;

  private scrollPosition = 0;
  private removeTrashKeyObserver?: () => void;
  private removeTabObserver?: () => void;
  private removeComponentStreamObserver?: () => void;
  private removeComponentManagerObserver?: () => void;
  private removeInnerNoteObserver?: () => void;

  private protectionTimeoutId: ReturnType<typeof setTimeout> | null = null;

  /* @ngInject */
  constructor($timeout: ng.ITimeoutService) {
    super($timeout);
    this.leftPanelPuppet = {
      onReady: () => this.reloadPreferences(),
    };
    this.rightPanelPuppet = {
      onReady: () => this.reloadPreferences(),
    };

    this.onPanelResizeFinish = this.onPanelResizeFinish.bind(this);
    this.setScrollPosition = this.setScrollPosition.bind(this);
    this.resetScrollPosition = this.resetScrollPosition.bind(this);
    this.editorComponentViewerRequestsReload =
      this.editorComponentViewerRequestsReload.bind(this);
    this.onEditorComponentLoad = () => {
      this.application.getDesktopService().redoSearch();
    };
    this.debounceReloadEditorComponent = debounce(
      this.debounceReloadEditorComponent.bind(this),
      25
    );
  }

  deinit() {
    this.removeComponentStreamObserver?.();
    (this.removeComponentStreamObserver as unknown) = undefined;
    this.removeInnerNoteObserver?.();
    (this.removeInnerNoteObserver as unknown) = undefined;
    this.removeComponentManagerObserver?.();
    (this.removeComponentManagerObserver as unknown) = undefined;
    this.removeTrashKeyObserver?.();
    this.removeTrashKeyObserver = undefined;
    this.clearNoteProtectionInactivityTimer();
    this.removeTabObserver?.();
    this.removeTabObserver = undefined;
    this.leftPanelPuppet = undefined;
    this.rightPanelPuppet = undefined;
    this.onEditorComponentLoad = undefined;
    this.statusTimeout = undefined;
    (this.onPanelResizeFinish as unknown) = undefined;
    super.deinit();
  }

  getState() {
    return this.state as EditorState;
  }

  get note() {
    return this.controller.note;
  }

  $onInit() {
    super.$onInit();
    this.registerKeyboardShortcuts();
    this.removeInnerNoteObserver =
      this.controller.addNoteInnerValueChangeObserver((note, source) => {
        this.onNoteInnerChange(note, source);
      });
    this.autorun(() => {
      this.setState({
        showProtectedWarning: this.appState.notes.showProtectedWarning,
      });
    });
    this.reloadEditorComponent();
    this.reloadStackComponents();

    const showProtectedWarning =
      this.note.protected && !this.application.hasProtectionSources();
    this.setShowProtectedOverlay(showProtectedWarning);

    this.reloadPreferences();

    if (this.controller.isTemplateNote) {
      this.$timeout(() => {
        this.focusTitle();
      });
    }
  }

  private onNoteInnerChange(note: SNNote, source: PayloadSource): void {
    if (note.uuid !== this.note.uuid) {
      throw Error('Editor received changes for non-current note');
    }
    if (isPayloadSourceRetrieved(source)) {
      this.editorValues.title = note.title;
      this.editorValues.text = note.text;
    }
    if (!this.editorValues.title) {
      this.editorValues.title = note.title;
    }
    if (!this.editorValues.text) {
      this.editorValues.text = note.text;
    }

    this.reloadSpellcheck();

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
          this.state.noteStatus &&
          note.lastSyncEnd!.getTime() > note.lastSyncBegan!.getTime()
        ) {
          this.showAllChangesSavedStatus();
        }
      } else {
        this.showSavingStatus();
      }
    }
  }

  $onDestroy(): void {
    if (this.state.editorComponentViewer) {
      this.application.componentManager?.destroyComponentViewer(
        this.state.editorComponentViewer
      );
    }
    super.$onDestroy();
  }

  /** @override */
  getInitialState() {
    return {
      availableStackComponents: [],
      stackComponentViewers: [],
      editorStateDidLoad: false,
      editorDebounce: EDITOR_DEBOUNCE,
      isDesktop: isDesktopApplication(),
      spellcheck: true,
      syncTakingTooLong: false,
      showActionsMenu: false,
      showHistoryMenu: false,
      noteStatus: undefined,
      textareaUnloading: false,
      showProtectedWarning: false,
    } as EditorState;
  }

  async onAppLaunch() {
    await super.onAppLaunch();
    this.streamItems();
    this.registerComponentManagerEventObserver();
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
        this.setShowProtectedOverlay(false);
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
      this.setShowProtectedOverlay(true);
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

  async dismissProtectedWarning() {
    let showNoteContents = true;
    if (this.application.hasProtectionSources()) {
      showNoteContents = await this.application.authorizeNoteAccess(this.note);
    }
    if (!showNoteContents) {
      return;
    }
    this.setShowProtectedOverlay(false);
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
    this.removeComponentStreamObserver = this.application.streamItems(
      ContentType.Component,
      async (_items, source) => {
        if (
          isPayloadSourceInternalChange(source) ||
          source === PayloadSource.InitialObserverRegistrationPush
        ) {
          return;
        }
        if (!this.note) return;
        await this.reloadStackComponents();
        this.debounceReloadEditorComponent();
      }
    );
  }

  private createComponentViewer(component: SNComponent) {
    const viewer = this.application.componentManager.createComponentViewer(
      component,
      this.note.uuid
    );
    return viewer;
  }

  public async editorComponentViewerRequestsReload(
    viewer: ComponentViewer
  ): Promise<void> {
    const component = viewer.component;
    this.application.componentManager.destroyComponentViewer(viewer);
    await this.setState({
      editorComponentViewer: undefined,
    });
    await this.setState({
      editorComponentViewer: this.createComponentViewer(component),
      editorStateDidLoad: true,
    });
  }

  /**
   * Calling reloadEditorComponent successively without waiting for state to settle
   * can result in componentViewers being dealloced twice
   */
  debounceReloadEditorComponent() {
    this.reloadEditorComponent();
  }

  private async reloadEditorComponent() {
    const newEditor = this.application.componentManager.editorForNote(
      this.note
    );
    /** Editors cannot interact with template notes so the note must be inserted */
    if (newEditor && this.controller.isTemplateNote) {
      await this.controller.insertTemplatedNote();
      this.associateComponentWithCurrentNote(newEditor);
    }
    const currentComponentViewer = this.state.editorComponentViewer;

    if (currentComponentViewer?.componentUuid !== newEditor?.uuid) {
      if (currentComponentViewer) {
        this.application.componentManager.destroyComponentViewer(
          currentComponentViewer
        );
      }
      await this.setState({
        editorComponentViewer: undefined,
      });
      if (newEditor) {
        await this.setState({
          editorComponentViewer: this.createComponentViewer(newEditor),
          editorStateDidLoad: true,
        });
      }
      reloadFont(this.state.monospaceFont);
    } else {
      await this.setState({
        editorStateDidLoad: true,
      });
    }
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
    const allMenus = ['showActionsMenu', 'showHistoryMenu'];
    const menuState: any = {};
    for (const candidate of allMenus) {
      if (candidate !== exclude) {
        menuState[candidate] = false;
      }
    }
    this.setState(menuState);
  }

  hasAvailableExtensions() {
    return (
      this.application.actionsManager.extensionsInContextOfItem(this.note)
        .length > 0
    );
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
    this.controller.save({
      editorValues: copyEditorValues(this.editorValues),
      isUserModified: true,
    });
  }

  onTitleEnter($event: Event) {
    ($event.target as HTMLInputElement).blur();
    this.onTitleChange();
    this.focusEditor();
  }

  onTitleChange() {
    this.controller.save({
      editorValues: copyEditorValues(this.editorValues),
      isUserModified: true,
      dontUpdatePreviews: true,
    });
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

  onContentFocus() {
    this.application
      .getAppState()
      .editorDidFocus(this.lastEditorFocusEventSource!);
    this.lastEditorFocusEventSource = undefined;
  }

  setShowProtectedOverlay(show: boolean) {
    this.appState.notes.setShowProtectedWarning(show);
  }

  async deleteNote(permanently: boolean) {
    if (this.controller.isTemplateNote) {
      this.application.alertService.alert(STRING_DELETE_PLACEHOLDER_ATTEMPT);
      return;
    }
    if (this.note.locked) {
      this.application.alertService.alert(STRING_DELETE_LOCKED_ATTEMPT);
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
        this.controller.save({
          editorValues: copyEditorValues(this.editorValues),
          bypassDebouncer: true,
          dontUpdatePreviews: true,
          customMutate: (mutator) => {
            mutator.trashed = true;
          },
        });
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

  async reloadSpellcheck() {
    const spellcheck = this.appState.notes.getSpellcheckStateForNote(this.note);

    if (spellcheck !== this.state.spellcheck) {
      await this.setState({ textareaUnloading: true });
      await this.setState({ textareaUnloading: false });
      reloadFont(this.state.monospaceFont);

      await this.setState({
        spellcheck,
      });
    }
  }

  async reloadPreferences() {
    const monospaceFont = this.application.getPreference(
      PrefKey.EditorMonospaceEnabled,
      true
    );

    const marginResizersEnabled = this.application.getPreference(
      PrefKey.EditorResizersEnabled,
      true
    );

    await this.reloadSpellcheck();

    await this.setState({
      monospaceFont,
      marginResizersEnabled,
    });

    if (!document.getElementById(ElementIds.EditorContent)) {
      /** Elements have not yet loaded due to ng-if around wrapper */
      return;
    }

    reloadFont(this.state.monospaceFont);

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

  /** @components */

  registerComponentManagerEventObserver() {
    this.removeComponentManagerObserver =
      this.application.componentManager.addEventObserver((eventName, data) => {
        if (eventName === ComponentManagerEvent.ViewerDidFocus) {
          const viewer = data?.componentViewer;
          if (viewer?.component.isEditor) {
            this.closeAllMenus();
          }
        }
      });
  }

  async reloadStackComponents() {
    const stackComponents = sortAlphabetically(
      this.application.componentManager
        .componentsForArea(ComponentArea.EditorStack)
        .filter((component) => component.active)
    );
    const enabledComponents = stackComponents.filter((component) => {
      return component.isExplicitlyEnabledForItem(this.note.uuid);
    });

    const needsNewViewer = enabledComponents.filter((component) => {
      const hasExistingViewer = this.state.stackComponentViewers.find(
        (viewer) => viewer.componentUuid === component.uuid
      );
      return !hasExistingViewer;
    });

    const needsDestroyViewer = this.state.stackComponentViewers.filter(
      (viewer) => {
        const viewerComponentExistsInEnabledComponents = enabledComponents.find(
          (component) => {
            return component.uuid === viewer.componentUuid;
          }
        );
        return !viewerComponentExistsInEnabledComponents;
      }
    );

    const newViewers: ComponentViewer[] = [];
    for (const component of needsNewViewer) {
      newViewers.push(
        this.application.componentManager.createComponentViewer(
          component,
          this.note.uuid
        )
      );
    }

    for (const viewer of needsDestroyViewer) {
      this.application.componentManager.destroyComponentViewer(viewer);
    }
    await this.setState({
      availableStackComponents: stackComponents,
      stackComponentViewers: newViewers,
    });
  }

  stackComponentExpanded(component: SNComponent): boolean {
    return !!this.state.stackComponentViewers.find(
      (viewer) => viewer.componentUuid === component.uuid
    );
  }

  async toggleStackComponent(component: SNComponent) {
    if (!component.isExplicitlyEnabledForItem(this.note.uuid)) {
      await this.associateComponentWithCurrentNote(component);
    } else {
      await this.disassociateComponentWithCurrentNote(component);
    }
    this.application.sync();
  }

  async disassociateComponentWithCurrentNote(component: SNComponent) {
    return this.application.runTransactionalMutation(
      transactionForDisassociateComponentWithCurrentNote(component, this.note)
    );
  }

  async associateComponentWithCurrentNote(component: SNComponent) {
    return this.application.runTransactionalMutation(
      transactionForAssociateComponentWithCurrentNote(component, this.note)
    );
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

        this.controller.save({
          editorValues: copyEditorValues(this.editorValues),
          bypassDebouncer: true,
        });
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

export class NoteViewDirective extends WebDirective {
  constructor() {
    super();
    this.restrict = 'E';
    this.scope = {
      controller: '=',
      application: '=',
    };
    this.template = template;
    this.replace = true;
    this.controller = NoteView;
    this.controllerAs = 'self';
    this.bindToController = true;
  }
}
