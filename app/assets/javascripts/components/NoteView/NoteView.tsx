import { WebApplication } from '@/ui_models/application';
import { createRef, JSX, RefObject } from 'preact';
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
import { EventSource } from '@/ui_models/app_state';
import {
  STRING_DELETE_PLACEHOLDER_ATTEMPT,
  STRING_DELETE_LOCKED_ATTEMPT,
  StringDeleteNote,
} from '@/strings';
import { confirmDialog } from '@/services/alertService';
import { PureComponent } from '../Abstract/PureComponent';
import { ProtectedNoteOverlay } from '../ProtectedNoteOverlay';
import { Icon } from '../Icon';
import { PinNoteButton } from '../PinNoteButton';
import { NotesOptionsPanel } from '../NotesOptionsPanel';
import { NoteTagsContainer } from '../NoteTagsContainer';
import { ActionsMenu } from '../ActionsMenu';
import { HistoryMenu } from '../HistoryMenu';
import { ComponentView } from '../ComponentView';
import { PanelSide, SimplePanelResizer } from '../SimplePanelResizer';

const MINIMUM_STATUS_DURATION = 400;
const TEXTAREA_DEBOUNCE = 100;

const ElementIds = {
  NoteTextEditor: 'note-text-editor',
  NoteTitleEditor: 'note-title-editor',
  EditorContent: 'editor-content',
};

type NoteStatus = {
  message?: string;
  desc?: string;
};

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

type State = {
  availableStackComponents: SNComponent[];
  editorComponentViewer?: ComponentViewer;
  editorStateDidLoad: boolean;
  editorTitle: string;
  editorText: string;
  isDesktop?: boolean;
  lockText: string;
  marginResizersEnabled?: boolean;
  monospaceFont?: boolean;
  noteLocked: boolean;
  noteStatus?: NoteStatus;
  saveError?: any;
  showActionsMenu: boolean;
  showHistoryMenu: boolean;
  showLockedIcon: boolean;
  showProtectedWarning: boolean;
  spellcheck: boolean;
  stackComponentViewers: ComponentViewer[];
  syncTakingTooLong: boolean;
  /** Setting to true then false will allow the main content textarea to be destroyed
   * then re-initialized. Used when reloading spellcheck status. */
  textareaUnloading: boolean;

  leftResizerWidth: number;
  leftResizerOffset: number;
  rightResizerWidth: number;
  rightResizerOffset: number;
};

interface Props {
  application: WebApplication;
  controller: NoteViewController;
}

export class NoteView extends PureComponent<Props, State> {
  readonly controller!: NoteViewController;

  private statusTimeout?: NodeJS.Timeout;
  private lastEditorFocusEventSource?: EventSource;
  onEditorComponentLoad?: () => void;

  private scrollPosition = 0;
  private removeTrashKeyObserver?: () => void;
  private removeTabObserver?: () => void;
  private removeComponentStreamObserver?: () => void;
  private removeComponentManagerObserver?: () => void;
  private removeInnerNoteObserver?: () => void;

  private protectionTimeoutId: ReturnType<typeof setTimeout> | null = null;

  private editorContentRef: RefObject<HTMLDivElement>;

  constructor(props: Props) {
    super(props, props.application);
    this.controller = props.controller;

    this.onEditorComponentLoad = () => {
      this.application.getDesktopService().redoSearch();
    };

    this.debounceReloadEditorComponent = debounce(
      this.debounceReloadEditorComponent.bind(this),
      25
    );

    this.textAreaChangeDebounceSave = debounce(
      this.textAreaChangeDebounceSave,
      TEXTAREA_DEBOUNCE
    );

    this.state = {
      availableStackComponents: [],
      editorStateDidLoad: false,
      editorText: '',
      editorTitle: '',
      isDesktop: isDesktopApplication(),
      lockText: 'Note Editing Disabled',
      noteStatus: undefined,
      noteLocked: this.controller.note.locked,
      showActionsMenu: false,
      showHistoryMenu: false,
      showLockedIcon: true,
      showProtectedWarning: false,
      spellcheck: true,
      stackComponentViewers: [],
      syncTakingTooLong: false,
      textareaUnloading: false,
      leftResizerWidth: 0,
      leftResizerOffset: 0,
      rightResizerWidth: 0,
      rightResizerOffset: 0,
    };

    this.editorContentRef = createRef<HTMLDivElement>();
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
    this.onEditorComponentLoad = undefined;
    this.statusTimeout = undefined;
    (this.onPanelResizeFinish as unknown) = undefined;
    super.deinit();
  }

  getState() {
    return this.state as State;
  }

  get note() {
    return this.controller.note;
  }

  componentDidMount(): void {
    super.componentDidMount();

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
      setTimeout(() => {
        this.focusTitle();
      });
    }
  }

  private onNoteInnerChange(note: SNNote, source: PayloadSource): void {
    if (note.uuid !== this.note.uuid) {
      throw Error('Editor received changes for non-current note');
    }

    let title = this.state.editorTitle,
      text = this.state.editorText;
    if (isPayloadSourceRetrieved(source)) {
      title = note.title;
      text = note.text;
    }
    if (!this.state.editorTitle) {
      title = note.title;
    }
    if (!this.state.editorText) {
      text = note.text;
    }
    if (title !== this.state.editorTitle) {
      this.setState({
        editorTitle: title,
      });
    }
    if (text !== this.state.editorText) {
      this.setState({
        editorText: text,
      });
    }

    if (!note.deleted && note.locked !== this.state.noteLocked) {
      this.setState({
        noteLocked: note.locked,
      });
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

  componentWillUnmount(): void {
    if (this.state.editorComponentViewer) {
      this.application.componentManager?.destroyComponentViewer(
        this.state.editorComponentViewer
      );
    }
    super.componentWillUnmount();
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

  public editorComponentViewerRequestsReload = async (
    viewer: ComponentViewer
  ): Promise<void> => {
    const component = viewer.component;
    this.application.componentManager.destroyComponentViewer(viewer);
    this.setState({
      editorComponentViewer: undefined,
    });
    this.setState({
      editorComponentViewer: this.createComponentViewer(component),
      editorStateDidLoad: true,
    });
  };

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
      this.setState({
        editorComponentViewer: undefined,
      });
      if (newEditor) {
        this.setState({
          editorComponentViewer: this.createComponentViewer(newEditor),
          editorStateDidLoad: true,
        });
      }
      reloadFont(this.state.monospaceFont);
    } else {
      this.setState({
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

  toggleMenu = (menu: keyof State) => {
    this.setMenuState(menu, !this.state[menu]);
    this.application.getAppState().notes.setContextMenuOpen(false);
  };

  closeAllMenus = (exclude?: string) => {
    if (!(this.state.showActionsMenu || this.state.showHistoryMenu)) {
      return;
    }
    const allMenus = ['showActionsMenu', 'showHistoryMenu'];
    const menuState: any = {};
    for (const candidate of allMenus) {
      if (candidate !== exclude) {
        menuState[candidate] = false;
      }
    }
    this.setState(menuState);
  };

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
      clearTimeout(this.statusTimeout);
    }
    if (wait) {
      this.statusTimeout = setTimeout(() => {
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
      clearTimeout(this.statusTimeout);
    }
  }

  onTextAreaChange = ({
    currentTarget,
  }: JSX.TargetedEvent<HTMLTextAreaElement, Event>) => {
    const text = currentTarget.value;
    this.setState({
      editorText: text,
    });
    this.textAreaChangeDebounceSave();
  };

  textAreaChangeDebounceSave = () => {
    this.controller.save({
      editorValues: {
        title: this.state.editorTitle,
        text: this.state.editorText,
      },
      isUserModified: true,
    });
  };

  onTitleEnter = ({
    currentTarget,
  }: JSX.TargetedEvent<HTMLInputElement, Event>) => {
    currentTarget.blur();
    this.focusEditor();
  };

  onTitleChange = ({
    currentTarget,
  }: JSX.TargetedEvent<HTMLInputElement, Event>) => {
    const title = currentTarget.value;
    this.setState({
      editorTitle: title,
    });
    this.controller.save({
      editorValues: {
        title: title,
        text: this.state.editorText,
      },
      isUserModified: true,
      dontUpdatePreviews: true,
    });
  };

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

  clickedTextArea = () => {
    this.closeAllMenus();
  };

  onContentFocus = () => {
    this.application
      .getAppState()
      .editorDidFocus(this.lastEditorFocusEventSource!);
    this.lastEditorFocusEventSource = undefined;
  };

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
          editorValues: {
            title: this.state.editorTitle,
            text: this.state.editorText,
          },
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

  onPanelResizeFinish = async (
    width: number,
    left: number,
    isMaxWidth: boolean
  ) => {
    if (isMaxWidth) {
      await this.application.setPreference(PrefKey.EditorWidth, null);
    } else {
      if (width !== undefined && width !== null) {
        await this.application.setPreference(PrefKey.EditorWidth, width);
      }
    }
    if (left !== undefined && left !== null) {
      await this.application.setPreference(PrefKey.EditorLeft, left);
    }
    this.application.sync();
  };

  async reloadSpellcheck() {
    const spellcheck = this.appState.notes.getSpellcheckStateForNote(this.note);

    if (spellcheck !== this.state.spellcheck) {
      this.setState({ textareaUnloading: true });
      this.setState({ textareaUnloading: false });
      reloadFont(this.state.monospaceFont);

      this.setState({
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

    this.setState({
      monospaceFont,
      marginResizersEnabled,
    });

    reloadFont(monospaceFont);

    if (marginResizersEnabled) {
      const width = this.application.getPreference(PrefKey.EditorWidth, null);
      if (width != null) {
        this.setState({
          leftResizerWidth: width,
          rightResizerWidth: width,
        });
      }
      const left = this.application.getPreference(PrefKey.EditorLeft, null);
      if (left != null) {
        this.setState({
          leftResizerOffset: left,
          rightResizerOffset: left,
        });
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
    this.setState({
      availableStackComponents: stackComponents,
      stackComponentViewers: newViewers,
    });
  }

  stackComponentExpanded(component: SNComponent): boolean {
    return !!this.state.stackComponentViewers.find(
      (viewer) => viewer.componentUuid === component.uuid
    );
  }

  toggleStackComponent = async (component: SNComponent) => {
    if (!component.isExplicitlyEnabledForItem(this.note.uuid)) {
      await this.associateComponentWithCurrentNote(component);
    } else {
      await this.disassociateComponentWithCurrentNote(component);
    }
    this.application.sync();
  };

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

  setScrollPosition = () => {
    const editor = document.getElementById(
      ElementIds.NoteTextEditor
    ) as HTMLInputElement;
    this.scrollPosition = editor.scrollTop;
  };

  resetScrollPosition = () => {
    const editor = document.getElementById(
      ElementIds.NoteTextEditor
    ) as HTMLInputElement;
    editor.scrollTop = this.scrollPosition;
  };

  onSystemEditorLoad(ref: HTMLTextAreaElement | null) {
    if (this.removeTabObserver || !ref) {
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
    ) as HTMLInputElement;

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
          const start = editor.selectionStart || 0;
          const end = editor.selectionEnd || 0;
          const spaces = '    ';
          /** Insert 4 spaces */
          editor.value =
            editor.value.substring(0, start) +
            spaces +
            editor.value.substring(end);
          /** Place cursor 4 spaces away from where the tab key was pressed */
          editor.selectionStart = editor.selectionEnd = start + 4;
        }
        this.setState({
          editorText: editor.value,
        });

        this.controller.save({
          editorValues: {
            title: this.state.editorTitle,
            text: this.state.editorText,
          },
          bypassDebouncer: true,
        });
      },
    });

    editor.addEventListener('scroll', this.setScrollPosition);
    editor.addEventListener('input', this.resetScrollPosition);

    const observer = new MutationObserver((records) => {
      for (const record of records) {
        const removedNodes = record.removedNodes.values();
        for (const node of removedNodes) {
          if (node === editor) {
            this.removeTabObserver?.();
            this.removeTabObserver = undefined;
            editor.removeEventListener('scroll', this.setScrollPosition);
            editor.removeEventListener('scroll', this.resetScrollPosition);
            this.scrollPosition = 0;
          }
        }
      }
    });

    observer.observe(editor.parentElement as HTMLElement, { childList: true });
  }

  render() {
    if (this.state.showProtectedWarning) {
      return (
        <div
          id="editor-column"
          aria-label="Note"
          className="section editor sn-component"
        >
          {this.state.showProtectedWarning && (
            <div className="h-full flex justify-center items-center">
              <ProtectedNoteOverlay
                appState={this.appState}
                hasProtectionSources={this.application.hasProtectionSources()}
                onViewNote={this.dismissProtectedWarning}
              />
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        id="editor-column"
        aria-label="Note"
        className="section editor sn-component"
      >
        <div className="flex-grow flex flex-col">
          <div className="sn-component">
            {this.state.noteLocked && (
              <div
                className="sk-app-bar no-edges"
                onMouseLeave={() => {
                  this.setState({
                    lockText: 'Note Editing Disabled',
                    showLockedIcon: true,
                  });
                }}
                onMouseOver={() => {
                  this.setState({
                    lockText: 'Enable editing',
                    showLockedIcon: false,
                  });
                }}
              >
                <div
                  onClick={() =>
                    this.appState.notes.setLockSelectedNotes(
                      !this.state.noteLocked
                    )
                  }
                  className="sk-app-bar-item"
                >
                  <div className="sk-label warning flex items-center">
                    {this.state.showLockedIcon && (
                      <Icon
                        type="pencil-off"
                        className="flex fill-current mr-2"
                      />
                    )}
                    {this.state.lockText}
                  </div>
                </div>
              </div>
            )}
          </div>

          {this.note && !this.note.errorDecrypting && (
            <div id="editor-title-bar" className="section-title-bar w-full">
              <div className="flex items-center justify-between h-8">
                <div
                  className={
                    (this.state.noteLocked ? 'locked' : '') + ' flex-grow'
                  }
                >
                  <div className="title overflow-auto">
                    <input
                      className="input"
                      disabled={this.state.noteLocked}
                      id={ElementIds.NoteTitleEditor}
                      onChange={this.onTitleChange}
                      onFocus={(event) => {
                        (event.target as HTMLTextAreaElement).select();
                      }}
                      onKeyUp={(event) =>
                        event.keyCode == 13 && this.onTitleEnter(event)
                      }
                      spellcheck={false}
                      value={this.state.editorTitle}
                    />
                  </div>
                </div>
                <div className="flex items-center">
                  <div id="save-status">
                    <div
                      className={
                        (this.state.syncTakingTooLong
                          ? 'warning sk-bold '
                          : '') +
                        (this.state.saveError ? 'danger sk-bold ' : '') +
                        ' message'
                      }
                    >
                      {this.state.noteStatus?.message}
                    </div>
                    {this.state.noteStatus?.desc && (
                      <div className="desc">{this.state.noteStatus.desc}</div>
                    )}
                  </div>
                  {this.appState.notes.selectedNotesCount > 0 && (
                    <>
                      <div className="mr-3">
                        <PinNoteButton appState={this.appState} />
                      </div>
                      <NotesOptionsPanel
                        application={this.application}
                        appState={this.appState}
                      />
                    </>
                  )}
                </div>
              </div>
              <NoteTagsContainer appState={this.appState} />
            </div>
          )}

          {this.note && (
            <div className="sn-component">
              <div id="editor-menu-bar" className="sk-app-bar no-edges">
                <div className="left">
                  <div
                    className={
                      (this.state.showActionsMenu ? 'selected' : '') +
                      ' sk-app-bar-item'
                    }
                    onClick={() => this.toggleMenu('showActionsMenu')}
                  >
                    <div className="sk-label">Actions</div>
                    {this.state.showActionsMenu && (
                      <ActionsMenu
                        item={this.note}
                        application={this.application}
                      />
                    )}
                  </div>
                  <div
                    className={
                      (this.state.showHistoryMenu ? 'selected' : '') +
                      ' sk-app-bar-item'
                    }
                    onClick={() => this.toggleMenu('showHistoryMenu')}
                  >
                    <div className="sk-label">History</div>
                    {this.state.showHistoryMenu && (
                      <HistoryMenu
                        item={this.note}
                        application={this.application}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {!this.note.errorDecrypting && (
            <div
              id={ElementIds.EditorContent}
              className={ElementIds.EditorContent}
              ref={this.editorContentRef}
            >
              {this.state.marginResizersEnabled &&
              this.editorContentRef.current ? (
                <div className="left">
                  <SimplePanelResizer
                    minWidth={300}
                    hoverable={true}
                    collapsable={false}
                    panel={this.editorContentRef.current}
                    side={PanelSide.Left}
                    left={this.state.leftResizerOffset}
                    width={this.state.leftResizerWidth}
                    resizeFinishCallback={this.onPanelResizeFinish}
                  />
                </div>
              ) : null}

              {this.state.editorComponentViewer && (
                <div className="component-view">
                  <ComponentView
                    componentViewer={this.state.editorComponentViewer}
                    onLoad={this.onEditorComponentLoad}
                    requestReload={this.editorComponentViewerRequestsReload}
                    application={this.application}
                    appState={this.appState}
                  />
                </div>
              )}

              {this.state.editorStateDidLoad &&
                !this.state.editorComponentViewer &&
                !this.state.textareaUnloading && (
                  <textarea
                    autocomplete="off"
                    className="editable font-editor"
                    dir="auto"
                    id={ElementIds.NoteTextEditor}
                    onChange={this.onTextAreaChange}
                    value={this.state.editorText}
                    readonly={this.state.noteLocked}
                    onClick={this.clickedTextArea}
                    onFocus={this.onContentFocus}
                    spellcheck={this.state.spellcheck}
                    ref={(ref) => this.onSystemEditorLoad(ref)}
                  ></textarea>
                )}

              {this.state.marginResizersEnabled &&
              this.editorContentRef.current ? (
                <SimplePanelResizer
                  minWidth={300}
                  hoverable={true}
                  collapsable={false}
                  panel={this.editorContentRef.current}
                  side={PanelSide.Right}
                  left={this.state.rightResizerOffset}
                  width={this.state.rightResizerWidth}
                  resizeFinishCallback={this.onPanelResizeFinish}
                />
              ) : null}
            </div>
          )}

          {this.note.errorDecrypting && (
            <div className="section">
              <div id="error-decrypting-container" className="sn-component">
                <div id="error-decrypting-panel" className="sk-panel">
                  <div className="sk-panel-header">
                    <div className="sk-panel-header-title">
                      {this.note.waitingForKey
                        ? 'Waiting for Key'
                        : 'Unable to Decrypt'}
                    </div>
                  </div>
                  <div className="sk-panel-content">
                    <div className="sk-panel-section">
                      {this.note.waitingForKey && (
                        <p className="sk-p">
                          This note is awaiting its encryption key to be ready.
                          Please wait for syncing to complete for this note to
                          be decrypted.
                        </p>
                      )}
                      {!this.note.waitingForKey && (
                        <p className="sk-p">
                          There was an error decrypting this item. Ensure you
                          are running the latest version of this app, then sign
                          out and sign back in to try again.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!this.note.errorDecrypting && (
            <div id="editor-pane-component-stack">
              {this.state.availableStackComponents.length > 0 && (
                <div
                  id="component-stack-menu-bar"
                  className="sk-app-bar no-edges"
                >
                  <div className="left">
                    {this.state.availableStackComponents.map((component) => {
                      return (
                        <div
                          key={component.uuid}
                          onClick={() => {
                            this.toggleStackComponent(component);
                          }}
                          className="sk-app-bar-item"
                        >
                          <div className="sk-app-bar-item-column">
                            <div
                              className={
                                (this.stackComponentExpanded(component) &&
                                component.active
                                  ? 'info '
                                  : '') +
                                (!this.stackComponentExpanded(component)
                                  ? 'neutral '
                                  : '') +
                                ' sk-circle small'
                              }
                            />
                          </div>
                          <div className="sk-app-bar-item-column">
                            <div className="sk-label">{component.name}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="sn-component">
                {this.state.stackComponentViewers.map((viewer) => {
                  return (
                    <div className="component-view component-stack-item">
                      <ComponentView
                        key={viewer.componentUuid}
                        componentViewer={viewer}
                        manualDealloc={true}
                        application={this.application}
                        appState={this.appState}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
}
