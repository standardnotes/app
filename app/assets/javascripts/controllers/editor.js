import angular from 'angular';
import {
  ApplicationEvents,
  isPayloadSourceRetrieved,
  ContentTypes,
  ProtectedActions
} from 'snjs';
import find from 'lodash/find';
import { isDesktopApplication } from '@/utils';
import { KeyboardModifiers, KeyboardKeys } from '@/services/keyboardManager';
import template from '%/editor.pug';
import { PureCtrl } from '@Controllers';
import { AppStateEvents, EventSources } from '@/services/state';
import {
  STRING_DELETED_NOTE,
  STRING_INVALID_NOTE,
  STRING_ELLIPSES,
  STRING_DELETE_PLACEHOLDER_ATTEMPT,
  STRING_DELETE_LOCKED_ATTEMPT,
  StringDeleteNote,
  StringEmptyTrash
} from '@/strings';
import { PrefKeys } from '@/services/preferencesManager';

const NOTE_PREVIEW_CHAR_LIMIT = 80;
const MINIMUM_STATUS_DURATION = 400;
const SAVE_TIMEOUT_DEBOUNCE = 350;
const SAVE_TIMEOUT_NO_DEBOUNCE = 100;
const EDITOR_DEBOUNCE = 200;

const AppDataKeys = {
  Pinned: 'pinned',
  Locked: 'locked',
  Archived: 'archived',
  PrefersPlainEditor: 'prefersPlainEditor'
};
const ElementIds = {
  NoteTextEditor: 'note-text-editor',
  NoteTitleEditor: 'note-title-editor',
  EditorContent: 'editor-content',
  NoteTagsComponentContainer: 'note-tags-component-container'
};
const Fonts = {
  DesktopMonospaceFamily: `Menlo,Consolas,'DejaVu Sans Mono',monospace`,
  WebMonospaceFamily: `monospace`,
  SansSerifFamily: `inherit`
};

class EditorCtrl extends PureCtrl {
  /* @ngInject */
  constructor($timeout) {
    super($timeout);
    this.leftPanelPuppet = {
      onReady: () => this.reloadPreferences()
    };
    this.rightPanelPuppet = {
      onReady: () => this.reloadPreferences()
    };
    /** Used by .pug template */
    this.prefKeyMonospace = PrefKeys.EditorMonospaceEnabled;
    this.prefKeySpellcheck = PrefKeys.EditorSpellcheck;
    this.prefKeyMarginResizers = PrefKeys.EditorResizersEnabled;
  }

  deinit() {
    this.removeTabObserver();
    this.leftPanelPuppet = null;
    this.rightPanelPuppet = null;
    this.onEditorLoad = null;
    this.unregisterComponent();
    this.unregisterComponent = null;
    super.deinit();
  }

  $onInit() {
    super.$onInit();
    this.registerKeyboardShortcuts();
  }

  /** @override */
  getInitialState() {
    return {
      componentStack: [],
      editorDebounce: EDITOR_DEBOUNCE,
      isDesktop: isDesktopApplication(),
      spellcheck: true,
      mutable: {
        tagsString: ''
      }
    };
  }

  onAppLaunch() {
    super.onAppLaunch();
    this.streamItems();
    this.registerComponentHandler();
  }

  /** @override */
  onAppStateEvent(eventName, data) {
    if (eventName === AppStateEvents.NoteChanged) {
      this.handleNoteSelectionChange(
        this.application.getAppState().getSelectedNote(),
        data.previousNote
      );
    } else if (eventName === AppStateEvents.PreferencesChanged) {
      this.reloadPreferences();
    }
  }

  /** @override */
  onAppEvent(eventName) {
    if (!this.state.note) {
      return;
    }
    if (eventName === ApplicationEvents.HighLatencySync) {
      this.setState({ syncTakingTooLong: true });
    } else if (eventName === ApplicationEvents.CompletedSync) {
      this.setState({ syncTakingTooLong: false });
      if (this.state.note.dirty) {
        /** if we're still dirty, don't change status, a sync is likely upcoming. */
      } else {
        const saved = this.state.note.lastSyncEnd > this.state.note.lastSyncBegan;
        const isInErrorState = this.state.saveError;
        if (isInErrorState || saved) {
          this.showAllChangesSavedStatus();
        }
      }
    } else if (eventName === ApplicationEvents.FailedSync) {
      /**
       * Only show error status in editor if the note is dirty.
       * Otherwise, it means the originating sync came from somewhere else
       * and we don't want to display an error here.
       */
      if (this.state.note.dirty) {
        this.showErrorStatus();
      }
    } else if (eventName === ApplicationEvents.LocalDatabaseWriteError) {
      this.showErrorStatus({
        message: "Offline Saving Issue",
        desc: "Changes not saved"
      });
    }
  }

  streamItems() {
    this.application.streamItems({
      contentType: ContentTypes.Note,
      stream: async ({ items, source }) => {
        if (!this.state.note) {
          return;
        }
        if (this.state.note.deleted || this.state.note.content.trashed) {
          return;
        }
        if (!isPayloadSourceRetrieved(source)) {
          return;
        }
        const matchingNote = items.find((item) => {
          return item.uuid === this.state.note.uuid;
        });
        if (!matchingNote) {
          return;
        }
        this.reloadTagsString();
      }
    });

    this.application.streamItems({
      contentType: ContentTypes.Tag,
      stream: async ({ items }) => {
        if (!this.state.note) {
          return;
        }
        for (const tag of items) {
          if (
            !this.state.note.savedTagsString ||
            tag.deleted ||
            tag.hasRelationshipWithItem(this.state.note)
          ) {
            this.reloadTagsString();
            break;
          }
        }
      }
    });

    this.application.streamItems({
      contentType: ContentTypes.Component,
      stream: async ({ items, source }) => {
        if (!this.state.note) {
          return;
        }
        /** Reload componentStack in case new ones were added or removed */
        this.reloadComponentStackArray();
        /** Observe editor changes to see if the current note should update its editor */
        const editors = items.filter(function (item) {
          return item.isEditor();
        });
        if (editors.length === 0) {
          return;
        }
        /** Find the most recent editor for note */
        const editor = this.editorForNote(this.state.note);
        this.setState({
          selectedEditor: editor
        });
        if (!editor) {
          this.reloadFont();
        }
      }
    });
  }

  async handleNoteSelectionChange(note, previousNote) {
    this.setState({
      note: this.application.getAppState().getSelectedNote(),
      showExtensions: false,
      showOptionsMenu: false,
      altKeyDown: false,
      noteStatus: null
    });
    if (!note) {
      this.setState({
        noteReady: false
      });
      return;
    }
    const associatedEditor = this.editorForNote(note);
    if (associatedEditor && associatedEditor !== this.state.selectedEditor) {
      /**
       * Setting note to not ready will remove the editor from view in a flash,
       * so we only want to do this if switching between external editors
       */
      this.setState({
        noteReady: false,
        selectedEditor: associatedEditor
      });
    } else if (!associatedEditor) {
      /** No editor */
      this.setState({
        selectedEditor: null
      });
    }
    await this.setState({
      noteReady: true,
    });
    this.reloadTagsString();
    this.reloadPreferences();

    if (note.dummy) {
      this.focusTitle();
    }
    if (previousNote && previousNote !== note) {
      if (previousNote.dummy) {
        this.performNoteDeletion(previousNote);
      }
    }

    this.reloadComponentContext();
  }

  editorForNote(note) {
    return this.application.componentManager.editorForNote(note);
  }

  setMenuState(menu, state) {
    this.setState({
      [menu]: state
    });
    this.closeAllMenus({ exclude: menu });
  }

  toggleMenu(menu) {
    this.setMenuState(menu, !this.state[menu]);
  }

  closeAllMenus({ exclude } = {}) {
    const allMenus = [
      'showOptionsMenu',
      'showEditorMenu',
      'showExtensions',
      'showSessionHistory'
    ];
    const menuState = {};
    for (const candidate of allMenus) {
      if (candidate !== exclude) {
        menuState[candidate] = false;
      }
    }
    this.setState(menuState);
  }

  editorMenuOnSelect = (component) => {
    if (!component || component.area === 'editor-editor') {
      /** If plain editor or other editor */
      this.setMenuState('showEditorMenu', false);
      const editor = component;
      if (this.state.selectedEditor && editor !== this.state.selectedEditor) {
        this.disassociateComponentWithCurrentNote(this.state.selectedEditor);
      }
      if (editor) {
        const prefersPlain = this.state.note.getAppDataItem(
          AppDataKeys.PrefersPlainEditor
        ) === true;
        if (prefersPlain) {
          this.state.note.setAppDataItem(
            AppDataKeys.PrefersPlainEditor,
            false
          );
          this.application.setItemNeedsSync({ item: this.state.note });
        }
        this.associateComponentWithCurrentNote(editor);
      } else {
        /** Note prefers plain editor */
        if (!this.state.note.getAppDataItem(AppDataKeys.PrefersPlainEditor)) {
          this.state.note.setAppDataItem(
            AppDataKeys.PrefersPlainEditor,
            true
          );
          this.application.setItemNeedsSync({ item: this.state.note });
        }

        this.reloadFont();
      }

      this.setState({
        selectedEditor: editor
      });
    } else if (component.area === 'editor-stack') {
      this.toggleStackComponentForCurrentItem(component);
    }

    /** Dirtying can happen above */
    this.application.sync();
  }

  hasAvailableExtensions() {
    return this.application.actionsManager.extensionsInContextOfItem(this.state.note).length > 0;
  }

  performFirefoxPinnedTabFix() {
    /**
     * For Firefox pinned tab issue:
     * When a new browser session is started, and SN is in a pinned tab,
     * SN is unusable until the tab is reloaded.
     */
    if (document.hidden) {
      window.location.reload();
    }
  }

  saveNote({
    bypassDebouncer,
    updateClientModified,
    dontUpdatePreviews
  }) {
    this.performFirefoxPinnedTabFix();
    const note = this.state.note;
    note.dummy = false;
    if (note.deleted) {
      this.application.alertService.alert({
        text: STRING_DELETED_NOTE
      });
      return;
    }
    if (!this.application.findItem({ uuid: note.uuid })) {
      this.application.alertService.alert({
        text: STRING_INVALID_NOTE
      });
      return;
    }

    this.showSavingStatus();

    if (!dontUpdatePreviews) {
      const text = note.text || '';
      const truncate = text.length > NOTE_PREVIEW_CHAR_LIMIT;
      const substring = text.substring(0, NOTE_PREVIEW_CHAR_LIMIT);
      const previewPlain = substring + (truncate ? STRING_ELLIPSES : '');
      note.content.preview_plain = previewPlain;
      note.content.preview_html = null;
    }
    this.application.setItemNeedsSync({
      item: note,
      updateUserModifiedDate: updateClientModified
    });
    if (this.saveTimeout) {
      this.$timeout.cancel(this.saveTimeout);
    }

    const noDebounce = bypassDebouncer || this.application.noAccount();
    const syncDebouceMs = noDebounce
      ? SAVE_TIMEOUT_NO_DEBOUNCE
      : SAVE_TIMEOUT_DEBOUNCE;
    this.saveTimeout = this.$timeout(() => {
      this.application.sync();
    }, syncDebouceMs);
  }

  showSavingStatus() {
    this.setStatus(
      { message: "Saving..." },
      false
    );
  }

  showAllChangesSavedStatus() {
    this.setState({
      saveError: false,
      syncTakingTooLong: false
    });
    this.setStatus({
      message: 'All changes saved',
    });
  }

  showErrorStatus(error) {
    if (!error) {
      error = {
        message: "Sync Unreachable",
        desc: "Changes saved offline"
      };
    }
    this.setState({
      saveError: true,
      syncTakingTooLong: false
    });
    this.setStatus(error);
  }

  setStatus(status, wait = true) {
    let waitForMs;
    if (!this.state.noteStatus || !this.state.noteStatus.date) {
      waitForMs = 0;
    } else {
      waitForMs = MINIMUM_STATUS_DURATION - (new Date() - this.state.noteStatus.date);
    }
    if (!wait || waitForMs < 0) {
      waitForMs = 0;
    }
    if (this.statusTimeout) {
      this.$timeout.cancel(this.statusTimeout);
    }
    this.statusTimeout = this.$timeout(() => {
      status.date = new Date();
      this.setState({
        noteStatus: status
      });
    }, waitForMs);
  }

  contentChanged() {
    this.saveNote({
      updateClientModified: true
    });
  }

  onTitleEnter($event) {
    $event.target.blur();
    this.onTitleChange();
    this.focusEditor();
  }

  onTitleChange() {
    this.saveNote({
      dontUpdatePreviews: true,
      updateClientModified: true
    });
  }

  focusEditor() {
    const element = document.getElementById(ElementIds.NoteTextEditor);
    if (element) {
      this.lastEditorFocusEventSource = EventSources.Script;
      element.focus();
    }
  }

  focusTitle() {
    document.getElementById(ElementIds.NoteTitleEditor).focus();
  }

  clickedTextArea() {
    this.setMenuState('showOptionsMenu', false);
  }

  onNameFocus() {
    this.editingName = true;
  }

  onContentFocus() {
    this.application.getAppState().editorDidFocus(this.lastEditorFocusEventSource);
    this.lastEditorFocusEventSource = null;
  }

  onNameBlur() {
    this.editingName = false;
  }

  selectedMenuItem(hide) {
    if (hide) {
      this.setMenuState('showOptionsMenu', false);
    }
  }

  async deleteNote(permanently) {
    if (this.state.note.dummy) {
      this.application.alertService.alert({
        text: STRING_DELETE_PLACEHOLDER_ATTEMPT
      });
      return;
    }
    const run = () => {
      if (this.state.note.locked) {
        this.application.alertService.alert({
          text: STRING_DELETE_LOCKED_ATTEMPT
        });
        return;
      }
      const title = this.state.note.safeTitle().length
        ? `'${this.state.note.title}'`
        : "this note";
      const text = StringDeleteNote({
        title: title,
        permanently: permanently
      });
      this.application.alertService.confirm({
        text: text,
        destructive: true,
        onConfirm: () => {
          if (permanently) {
            this.performNoteDeletion(this.state.note);
          } else {
            this.state.note.content.trashed = true;
            this.saveNote({
              bypassDebouncer: true,
              dontUpdatePreviews: true
            });
          }
          this.application.getAppState().setSelectedNote(null);
          this.setMenuState('showOptionsMenu', false);
        }
      });
    };
    const requiresPrivilege = await this.application.privilegesService.actionRequiresPrivilege(
      ProtectedActions.DeleteNote
    );
    if (requiresPrivilege) {
      this.application.presentPrivilegesModal(
        ProtectedActions.DeleteNote,
        () => {
          run();
        }
      );
    } else {
      run();
    }
  }

  performNoteDeletion(note) {
    this.application.deleteItem({ item: note });
    if (note === this.state.note) {
      this.setState({
        note: null
      });
    }
    if (note.dummy) {
      this.application.deleteItemLocally({ item: note });
      return;
    }
    this.application.sync();
  }

  restoreTrashedNote() {
    this.state.note.content.trashed = false;
    this.saveNote({
      bypassDebouncer: true,
      dontUpdatePreviews: true
    });
    this.application.getAppState().setSelectedNote(null);
  }

  deleteNotePermanantely() {
    this.deleteNote(true);
  }

  getTrashCount() {
    return this.application.getTrashedItems().length;
  }

  emptyTrash() {
    const count = this.getTrashCount();
    this.application.alertService.confirm({
      text: StringEmptyTrash({ count }),
      destructive: true,
      onConfirm: () => {
        this.application.emptyTrash();
        this.application.sync();
      }
    });
  }

  togglePin() {
    this.state.note.setAppDataItem(
      AppDataKeys.Pinned,
      !this.state.note.pinned
    );
    this.saveNote({
      bypassDebouncer: true,
      dontUpdatePreviews: true
    });
  }

  toggleLockNote() {
    this.state.note.setAppDataItem(
      AppDataKeys.Locked,
      !this.state.note.locked
    );
    this.saveNote({
      bypassDebouncer: true,
      dontUpdatePreviews: true
    });
  }

  toggleProtectNote() {
    this.state.note.content.protected = !this.state.note.content.protected;
    this.saveNote({
      bypassDebouncer: true,
      dontUpdatePreviews: true
    });

    /** Show privileges manager if protection is not yet set up */
    this.application.privilegesService.actionHasPrivilegesConfigured(
      ProtectedActions.ViewProtectedNotes
    ).then((configured) => {
      if (!configured) {
        this.application.presentPrivilegesManagementModal();
      }
    });
  }

  toggleNotePreview() {
    this.state.note.content.hidePreview = !this.state.note.content.hidePreview;
    this.saveNote({
      bypassDebouncer: true,
      dontUpdatePreviews: true
    });
  }

  toggleArchiveNote() {
    this.state.note.setAppDataItem(
      AppDataKeys.Archived,
      !this.state.note.archived
    );
    this.saveNote({
      bypassDebouncer: true,
      dontUpdatePreviews: true
    });
  }

  reloadTagsString() {
    this.setState({
      mutable: {
        ...this.state.mutable,
        tagsString: this.state.note.tagsString()
      }
    });
  }

  addTag(tag) {
    const strings = this.state.note.tags.map((currentTag) => {
      return currentTag.title;
    });
    strings.push(tag.title);
    this.saveTags({ strings: strings });
  }

  removeTag(tag) {
    const strings = this.state.note.tags.map((currentTag) => {
      return currentTag.title;
    }).filter((title) => {
      return title !== tag.title;
    });
    this.saveTags({ strings: strings });
  }

  async saveTags({ strings } = {}) {
    if (!strings && this.state.mutable.tagsString === this.state.note.tagsString()) {
      return;
    }
    if (!strings) {
      strings = this.state.mutable.tagsString.split('#').filter((string) => {
        return string.length > 0;
      }).map((string) => {
        return string.trim();
      });
    }
    this.state.note.dummy = false;

    const toRemove = [];
    for (const tag of this.state.note.tags) {
      if (strings.indexOf(tag.title) === -1) {
        toRemove.push(tag);
      }
    }
    for (const tagToRemove of toRemove) {
      tagToRemove.removeItemAsRelationship(this.state.note);
    }
    this.application.setItemsNeedsSync({ items: toRemove });
    const tags = [];
    for (const tagString of strings) {
      const existingRelationship = find(
        this.state.note.tags,
        { title: tagString }
      );
      if (!existingRelationship) {
        tags.push(
          await this.application.findOrCreateTag({ title: tagString })
        );
      }
    }
    for (const tag of tags) {
      tag.addItemAsRelationship(this.state.note);
    }
    this.application.saveItems({ items: tags });
    this.reloadTagsString();
  }

  onPanelResizeFinish = (width, left, isMaxWidth) => {
    if (isMaxWidth) {
      this.application.getPrefsService().setUserPrefValue(
        PrefKeys.EditorWidth,
        null
      );
    } else {
      if (width !== undefined && width !== null) {
        this.application.getPrefsService().setUserPrefValue(
          PrefKeys.EditorWidth,
          width
        );
        this.leftPanelPuppet.setWidth(width);
      }
    }
    if (left !== undefined && left !== null) {
      this.application.getPrefsService().setUserPrefValue(
        PrefKeys.EditorLeft,
        left
      );
      this.rightPanelPuppet.setLeft(left);
    }
    this.application.getPrefsService().syncUserPreferences();
  }

  reloadPreferences() {
    const monospaceEnabled = this.application.getPrefsService().getValue(
      PrefKeys.EditorMonospaceEnabled,
      true
    );
    const spellcheck = this.application.getPrefsService().getValue(
      PrefKeys.EditorSpellcheck,
      true
    );
    const marginResizersEnabled = this.application.getPrefsService().getValue(
      PrefKeys.EditorResizersEnabled,
      true
    );
    this.setState({
      monospaceEnabled,
      spellcheck,
      marginResizersEnabled
    });

    if (!document.getElementById(ElementIds.EditorContent)) {
      /** Elements have not yet loaded due to ng-if around wrapper */
      return;
    }

    this.reloadFont();

    if (
      this.state.marginResizersEnabled &&
      this.leftPanelPuppet.ready &&
      this.rightPanelPuppet.ready
    ) {
      const width = this.application.getPrefsService().getValue(
        PrefKeys.EditorWidth,
        null
      );
      if (width != null) {
        this.leftPanelPuppet.setWidth(width);
        this.rightPanelPuppet.setWidth(width);
      }
      const left = this.application.getPrefsService().getValue(
        PrefKeys.EditorLeft,
        null
      );
      if (left != null) {
        this.leftPanelPuppet.setLeft(left);
        this.rightPanelPuppet.setLeft(left);
      }
    }
  }

  reloadFont() {
    const editor = document.getElementById(
      ElementIds.NoteTextEditor
    );
    if (!editor) {
      return;
    }
    if (this.state.monospaceEnabled) {
      if (this.state.isDesktop) {
        editor.style.fontFamily = Fonts.DesktopMonospaceFamily;
      } else {
        editor.style.fontFamily = Fonts.WebMonospaceFamily;
      }
    } else {
      editor.style.fontFamily = Fonts.SansSerifFamily;
    }
  }

  async toggleKey(key) {
    this[key] = !this[key];
    this.application.getPrefsService().setUserPrefValue(
      key,
      this[key],
      true
    );
    this.reloadFont();

    if (key === PrefKeys.EditorSpellcheck) {
      /** Allows textarea to reload */
      await this.setState({
        noteReady: false
      });
      this.setState({
        noteReady: true
      });
      this.reloadFont();
    } else if (key === PrefKeys.EditorResizersEnabled && this[key] === true) {
      this.$timeout(() => {
        this.leftPanelPuppet.flash();
        this.rightPanelPuppet.flash();
      });
    }
  }

  /** @components */

  onEditorLoad = (editor) => {
    this.application.getDesktopService().redoSearch();
  }

  registerComponentHandler() {
    this.unregisterComponent = this.application.componentManager.registerHandler({
      identifier: 'editor',
      areas: [
        'note-tags',
        'editor-stack',
        'editor-editor'
      ],
      activationHandler: (component) => {
        if (component.area === 'note-tags') {
          this.setState({
            tagsComponent: component.active ? component : null
          });
        } else if (component.area === 'editor-editor') {
          if (
            component === this.state.selectedEditor &&
            !component.active
          ) {
            this.setState({ selectedEditor: null });
          }
          else if (this.state.selectedEditor) {
            if (this.state.selectedEditor.active && this.state.note) {
              if (
                component.isExplicitlyEnabledForItem(this.state.note)
                && !this.state.selectedEditor.isExplicitlyEnabledForItem(this.state.note)
              ) {
                this.setState({ selectedEditor: component });
              }
            }
          }
          else if (this.state.note) {
            const enableable = (
              component.isExplicitlyEnabledForItem(this.state.note)
              || component.isDefaultEditor()
            );
            if (
              component.active
              && enableable
            ) {
              this.setState({ selectedEditor: component });
            } else {
              /**
               * Not a candidate, and no qualified editor.
               * Disable the current editor.
               */
              this.setState({ selectedEditor: null });
            }
          }

        } else if (component.area === 'editor-stack') {
          this.reloadComponentContext();
        }
      },
      contextRequestHandler: (component) => {
        if (
          component === this.state.selectedEditor ||
          component === this.state.tagsComponent ||
          this.state.componentStack.includes(component)
        ) {
          return this.state.note;
        }
      },
      focusHandler: (component, focused) => {
        if (component.isEditor() && focused) {
          this.closeAllMenus();
        }
      },
      actionHandler: (component, action, data) => {
        if (action === 'set-size') {
          const setSize = function (element, size) {
            const widthString = typeof size.width === 'string'
              ? size.width
              : `${data.width}px`;
            const heightString = typeof size.height === 'string'
              ? size.height
              : `${data.height}px`;
            element.setAttribute(
              'style',
              `width: ${widthString}; height: ${heightString};`
            );
          };
          if (data.type === 'container') {
            if (component.area === 'note-tags') {
              const container = document.getElementById(
                ElementIds.NoteTagsComponentContainer
              );
              setSize(container, data);
            }
          }
        }
        else if (action === 'associate-item') {
          if (data.item.content_type === 'Tag') {
            const tag = this.application.findItem({ uuid: data.item.uuid });
            this.addTag(tag);
          }
        }
        else if (action === 'deassociate-item') {
          const tag = this.application.findItem({ uuid: data.item.uuid });
          this.removeTag(tag);
        }
        else if (action === 'save-items') {
          const includesNote = data.items.map((item) => {
            return item.uuid;
          }).includes(this.state.note.uuid);
          if (includesNote) {
            this.showSavingStatus();
          }
        }
      }
    });
  }

  reloadComponentStackArray() {
    const components = this.application.componentManager.componentsForArea('editor-stack')
      .sort((a, b) => {
        return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
      });

    this.setState({
      componentStack: components
    });
  }

  reloadComponentContext() {
    this.reloadComponentStackArray();
    if (this.state.note) {
      for (const component of this.state.componentStack) {
        if (component.active) {
          this.application.componentManager.setComponentHidden(
            component,
            !component.isExplicitlyEnabledForItem(this.state.note)
          );
        }
      }
    }

    this.application.componentManager.contextItemDidChangeInArea('note-tags');
    this.application.componentManager.contextItemDidChangeInArea('editor-stack');
    this.application.componentManager.contextItemDidChangeInArea('editor-editor');
  }

  toggleStackComponentForCurrentItem(component) {
    if (component.hidden || !component.active) {
      this.application.componentManager.setComponentHidden(component, false);
      this.associateComponentWithCurrentNote(component);
      if (!component.active) {
        this.application.componentManager.activateComponent(component);
      }
      this.application.componentManager.contextItemDidChangeInArea('editor-stack');
    } else {
      this.application.componentManager.setComponentHidden(component, true);
      this.disassociateComponentWithCurrentNote(component);
    }
  }

  disassociateComponentWithCurrentNote(component) {
    component.associatedItemIds = component.associatedItemIds.filter((id) => {
      return id !== this.state.note.uuid;
    });

    if (!component.disassociatedItemIds.includes(this.state.note.uuid)) {
      component.disassociatedItemIds.push(this.state.note.uuid);
    }

    this.application.saveItem({ item: component });
  }

  associateComponentWithCurrentNote(component) {
    component.disassociatedItemIds = component.disassociatedItemIds
      .filter((id) => {
        return id !== this.state.note.uuid;
      });

    if (!component.associatedItemIds.includes(this.state.note.uuid)) {
      component.associatedItemIds.push(this.state.note.uuid);
    }

    this.application.saveItem({ item: component });
  }

  registerKeyboardShortcuts() {
    this.altKeyObserver = this.application.getKeyboardService().addKeyObserver({
      modifiers: [
        KeyboardModifiers.Alt
      ],
      onKeyDown: () => {
        this.setState({
          altKeyDown: true
        });
      },
      onKeyUp: () => {
        this.setState({
          altKeyDown: false
        });
      }
    });

    this.trashKeyObserver = this.application.getKeyboardService().addKeyObserver({
      key: KeyboardKeys.Backspace,
      notElementIds: [
        ElementIds.NoteTextEditor,
        ElementIds.NoteTitleEditor
      ],
      modifiers: [KeyboardModifiers.Meta],
      onKeyDown: () => {
        this.deleteNote();
      },
    });

    this.deleteKeyObserver = this.application.getKeyboardService().addKeyObserver({
      key: KeyboardKeys.Backspace,
      modifiers: [
        KeyboardModifiers.Meta,
        KeyboardModifiers.Shift,
        KeyboardModifiers.Alt
      ],
      onKeyDown: (event) => {
        event.preventDefault();
        this.deleteNote(true);
      },
    });
  }

  onSystemEditorLoad() {
    if (this.tabObserver) {
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
    );
    this.tabObserver = this.application.getKeyboardService().addKeyObserver({
      element: editor,
      key: KeyboardKeys.Tab,
      onKeyDown: (event) => {
        if (this.state.note.locked || event.shiftKey) {
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
          const start = editor.selectionStart;
          const end = editor.selectionEnd;
          const spaces = '    ';
          /** Insert 4 spaces */
          editor.value = editor.value.substring(0, start)
            + spaces + editor.value.substring(end);
          /** Place cursor 4 spaces away from where the tab key was pressed */
          editor.selectionStart = editor.selectionEnd = start + 4;
        }

        const note = this.state.note;
        note.text = editor.value;
        this.setState({
          note: note
        });
        this.saveNote({
          bypassDebouncer: true
        });
      },
    });

    /**
     * Handles when the editor is destroyed,
     * (and not when our controller is destroyed.)
     */
    angular.element(editor).one('$destroy', () => {
      this.removeTabObserver();
    });
  }

  removeTabObserver() {
    if (!this.application) {
      return;
    }
    const keyboardService = this.application.getKeyboardService();
    if (this.tabObserver && keyboardService) {
      keyboardService.removeKeyObserver(this.tabObserver);
      this.tabObserver = null;
    }
  }
}

export class EditorPanel {
  constructor() {
    this.restrict = 'E';
    this.scope = {
      application: '='
    };
    this.template = template;
    this.replace = true;
    this.controller = EditorCtrl;
    this.controllerAs = 'self';
    this.bindToController = true;
  }
}
