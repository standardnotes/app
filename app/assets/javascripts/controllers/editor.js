import angular from 'angular';
import { SFModelManager } from 'snjs';
import { isDesktopApplication } from '@/utils';
import { KeyboardManager } from '@/services/keyboardManager';
import { PrivilegesManager } from '@/services/privilegesManager';
import template from '%/editor.pug';
import { PureCtrl } from '@Controllers';
import {
  APP_STATE_EVENT_NOTE_CHANGED,
  APP_STATE_EVENT_PREFERENCES_CHANGED,
  EVENT_SOURCE_SCRIPT
} from '@/state';
import {
  STRING_DELETED_NOTE,
  STRING_INVALID_NOTE,
  STRING_ELLIPSES,
  STRING_GENERIC_SAVE_ERROR,
  STRING_DELETE_PLACEHOLDER_ATTEMPT,
  STRING_DELETE_LOCKED_ATTEMPT,
  StringDeleteNote,
  StringEmptyTrash
} from '@/strings';
import {
  PREF_EDITOR_WIDTH,
  PREF_EDITOR_LEFT,
  PREF_EDITOR_MONOSPACE_ENABLED,
  PREF_EDITOR_SPELLCHECK,
  PREF_EDITOR_RESIZERS_ENABLED
} from '@/services/preferencesManager';

const NOTE_PREVIEW_CHAR_LIMIT = 80;
const MINIMUM_STATUS_DURATION = 400;
const SAVE_TIMEOUT_DEBOUNCE = 350;
const SAVE_TIMEOUT_NO_DEBOUNCE = 100;
const EDITOR_DEBOUNCE = 200;

const APP_DATA_KEY_PINNED = 'pinned';
const APP_DATA_KEY_LOCKED = 'locked';
const APP_DATA_KEY_ARCHIVED = 'archived';
const APP_DATA_KEY_PREFERS_PLAIN_EDITOR = 'prefersPlainEditor';

const ELEMENT_ID_NOTE_TEXT_EDITOR = 'note-text-editor';
const ELEMENT_ID_NOTE_TITLE_EDITOR = 'note-title-editor';
const ELEMENT_ID_EDITOR_CONTENT = 'editor-content';
const ELEMENT_ID_NOTE_TAGS_COMPONENT_CONTAINER = 'note-tags-component-container';

const DESKTOP_MONOSPACE_FAMILY = `Menlo,Consolas,'DejaVu Sans Mono',monospace`;
const WEB_MONOSPACE_FAMILY = `monospace`;
const SANS_SERIF_FAMILY = `inherit`;

class EditorCtrl extends PureCtrl {
  /* @ngInject */
  constructor(
    $timeout,
    $rootScope,
    alertManager,
    appState,
    authManager,
    actionsManager,
    componentManager,
    desktopManager,
    keyboardManager,
    modelManager,
    preferencesManager,
    privilegesManager,
    sessionHistory /** Unused below, required to load globally */,
    syncManager,
  ) {
    super($timeout);
    this.$rootScope = $rootScope;
    this.alertManager = alertManager;
    this.appState = appState;
    this.actionsManager = actionsManager;
    this.authManager = authManager;
    this.componentManager = componentManager;
    this.desktopManager = desktopManager;
    this.keyboardManager = keyboardManager;
    this.modelManager = modelManager;
    this.preferencesManager = preferencesManager;
    this.privilegesManager = privilegesManager;
    this.syncManager = syncManager;

    this.state = {
      componentStack: [],
      editorDebounce: EDITOR_DEBOUNCE,
      isDesktop: isDesktopApplication(),
      spellcheck: true
    };

    this.leftResizeControl = {};
    this.rightResizeControl = {};

    this.addAppStateObserver();
    this.addSyncEventHandler();
    this.addSyncStatusObserver();
    this.addMappingObservers();
    this.registerComponentHandler();
    this.registerKeyboardShortcuts();

    /** Used by .pug template */
    this.prefKeyMonospace = PREF_EDITOR_MONOSPACE_ENABLED;
    this.prefKeySpellcheck = PREF_EDITOR_SPELLCHECK;
    this.prefKeyMarginResizers = PREF_EDITOR_RESIZERS_ENABLED;
  }

  addAppStateObserver() {
    this.appState.addObserver((eventName, data) => {
      if (eventName === APP_STATE_EVENT_NOTE_CHANGED) {
        this.handleNoteSelectionChange(
          this.appState.getSelectedNote(),
          data.previousNote
        );
      } else if (eventName === APP_STATE_EVENT_PREFERENCES_CHANGED) {
        this.loadPreferences();
      }
    });
  }

  async handleNoteSelectionChange(note, previousNote) {
    this.setState({
      note: this.appState.getSelectedNote(),
      showExtensions: false,
      showOptionsMenu: false,
      altKeyDown: false,
      noteStatus: null
    });
    if (!note) {
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
    this.loadPreferences();

    if (note.dummy) {
      this.focusEditor();
    }
    if (previousNote && previousNote !== note) {
      if (previousNote.dummy) {
        this.performNoteDeletion(previousNote);
      }
    }

    this.reloadComponentContext();
  }

  addMappingObservers() {
    this.modelManager.addItemSyncObserver(
      'editor-note-observer',
      'Note',
      (allItems, validItems, deletedItems, source) => {
        if (!this.state.note) {
          return;
        }
        if (this.state.note.deleted || this.state.note.content.trashed) {
          return;
        }
        if (!SFModelManager.isMappingSourceRetrieved(source)) {
          return;
        }
        const matchingNote = allItems.find((item) => {
          return item.uuid === this.state.note.uuid;
        });
        if (!matchingNote) {
          return;
        }
        this.reloadTagsString();
      });

    this.modelManager.addItemSyncObserver(
      'editor-tag-observer',
      'Tag',
      (allItems, validItems, deletedItems, source) => {
        if (!this.state.note) {
          return;
        }
        for (const tag of allItems) {
          if (
            !this.state.note.savedTagsString ||
            tag.deleted ||
            tag.hasRelationshipWithItem(this.state.note)
          ) {
            this.reloadTagsString();
            break;
          }
        }
      });

    this.modelManager.addItemSyncObserver(
      'editor-component-observer',
      'SN|Component',
      (allItems, validItems, deletedItems, source) => {
        if (!this.state.note) {
          return;
        }
        /** Reload componentStack in case new ones were added or removed */
        this.reloadComponentStackArray();
        /** Observe editor changes to see if the current note should update its editor */
        const editors = allItems.filter(function (item) {
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
      });
  }

  addSyncEventHandler() {
    this.syncManager.addEventHandler((eventName, data) => {
      if (!this.state.note) {
        return;
      }
      if (eventName === 'sync:taking-too-long') {
        this.setState({
          syncTakingTooLong: true
        });
      } else if (eventName === 'sync:completed') {
        this.setState({
          syncTakingTooLong: false
        });
        if (this.state.note.dirty) {
          /** if we're still dirty, don't change status, a sync is likely upcoming. */
        } else {
          const savedItem = data.savedItems.find((item) => {
            return item.uuid === this.state.note.uuid;
          });
          const isInErrorState = this.state.saveError;
          if (isInErrorState || savedItem) {
            this.showAllChangesSavedStatus();
          }
        }
      } else if (eventName === 'sync:error') {
        /**
         * Only show error status in editor if the note is dirty.
         * Otherwise, it means the originating sync came from somewhere else
         * and we don't want to display an error here.
         */
        if (this.state.note.dirty) {
          this.showErrorStatus();
        }
      }
    });
  }

  addSyncStatusObserver() {
    this.syncStatusObserver = this.syncManager.
      registerSyncStatusObserver((status) => {
        if (status.localError) {
          this.$timeout(() => {
            this.showErrorStatus({
              message: "Offline Saving Issue",
              desc: "Changes not saved"
            });
          }, 500);
        }
      });
  }

  editorForNote(note) {
    return this.componentManager.editorForNote(note);
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
          APP_DATA_KEY_PREFERS_PLAIN_EDITOR
        ) === true;
        if (prefersPlain) {
          this.state.note.setAppDataItem(
            APP_DATA_KEY_PREFERS_PLAIN_EDITOR,
            false
          );
          this.modelManager.setItemDirty(this.state.note);
        }
        this.associateComponentWithCurrentNote(editor);
      } else {
        /** Note prefers plain editor */
        if (!this.state.note.getAppDataItem(APP_DATA_KEY_PREFERS_PLAIN_EDITOR)) {
          this.state.note.setAppDataItem(
            APP_DATA_KEY_PREFERS_PLAIN_EDITOR,
            true
          );
          this.modelManager.setItemDirty(this.state.note);
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
    this.syncManager.sync();
  }

  hasAvailableExtensions() {
    return this.actionsManager.extensionsInContextOfItem(this.state.note).length > 0;
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
      this.alertManager.alert({
        text: STRING_DELETED_NOTE
      });
      return;
    }
    if (!this.modelManager.findItem(note.uuid)) {
      this.alertManager.alert({
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
    this.modelManager.setItemDirty(
      note,
      true,
      updateClientModified
    );
    if (this.saveTimeout) {
      this.$timeout.cancel(this.saveTimeout);
    }

    const noDebounce = bypassDebouncer || this.authManager.offline();
    const syncDebouceMs = noDebounce
      ? SAVE_TIMEOUT_NO_DEBOUNCE
      : SAVE_TIMEOUT_DEBOUNCE;
    this.saveTimeout = this.$timeout(() => {
      this.syncManager.sync().then((response) => {
        if (response && response.error && !this.didShowErrorAlert) {
          this.didShowErrorAlert = true;
          this.alertManager.alert({
            text: STRING_GENERIC_SAVE_ERROR
          });
        }
      });
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
    let status = "All changes saved";
    if (this.authManager.offline()) {
      status += " (offline)";
    }
    this.setStatus(
      { message: status }
    );
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
    const element = document.getElementById(ELEMENT_ID_NOTE_TEXT_EDITOR);
    if (element) {
      this.lastEditorFocusEventSource = EVENT_SOURCE_SCRIPT;
      element.focus();
    }
  }

  focusTitle() {
    document.getElementById(ELEMENT_ID_NOTE_TITLE_EDITOR).focus();
  }

  clickedTextArea() {
    this.setMenuState('showOptionsMenu', false);
  }

  onNameFocus() {
    this.editingName = true;
  }

  onContentFocus() {
    this.appState.editorDidFocus(this.lastEditorFocusEventSource);
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
      this.alertManager.alert({
        text: STRING_DELETE_PLACEHOLDER_ATTEMPT
      });
      return;
    }
    const run = () => {
      if (this.state.note.locked) {
        this.alertManager.alert({
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
      this.alertManager.confirm({
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
          this.appState.setSelectedNote(null);
          this.setMenuState('showOptionsMenu', false);
        }
      });
    };
    const requiresPrivilege = await this.privilegesManager.actionRequiresPrivilege(
      PrivilegesManager.ActionDeleteNote
    );
    if (requiresPrivilege) {
      this.privilegesManager.presentPrivilegesModal(
        PrivilegesManager.ActionDeleteNote,
        () => {
          run();
        }
      );
    } else {
      run();
    }
  }

  performNoteDeletion(note) {
    this.modelManager.setItemToBeDeleted(note);
    if (note === this.state.note) {
      this.setState({
        note: null
      });
    }
    if (note.dummy) {
      this.modelManager.removeItemLocally(note);
      return;
    }
    this.syncManager.sync();
  }

  restoreTrashedNote() {
    this.state.note.content.trashed = false;
    this.saveNote({
      bypassDebouncer: true,
      dontUpdatePreviews: true
    });
    this.appState.setSelectedNote(null);
  }

  deleteNotePermanantely() {
    this.deleteNote(true);
  }

  getTrashCount() {
    return this.modelManager.trashedItems().length;
  }

  emptyTrash() {
    const count = this.getTrashCount();
    this.alertManager.confirm({
      text: StringEmptyTrash({ count }),
      destructive: true,
      onConfirm: () => {
        this.modelManager.emptyTrash();
        this.syncManager.sync();
      }
    });
  }

  togglePin() {
    this.state.note.setAppDataItem(
      APP_DATA_KEY_PINNED,
      !this.state.note.pinned
    );
    this.saveNote({
      bypassDebouncer: true,
      dontUpdatePreviews: true
    });
  }

  toggleLockNote() {
    this.state.note.setAppDataItem(
      APP_DATA_KEY_LOCKED,
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

    /** Show privilegesManager if protection is not yet set up */
    this.privilegesManager.actionHasPrivilegesConfigured(
      PrivilegesManager.ActionViewProtectedNotes
    ).then((configured) => {
      if (!configured) {
        this.privilegesManager.presentPrivilegesManagementModal();
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
      APP_DATA_KEY_ARCHIVED,
      !this.state.note.archived
    );
    this.saveNote({
      bypassDebouncer: true,
      dontUpdatePreviews: true
    });
  }

  reloadTagsString() {
    this.setState({
      tagsString: this.state.note.tagsString()
    });
  }

  addTag(tag) {
    const strings = this.state.note.tags.map((currentTag) => {
      return currentTag.title;
    });
    strings.push(tag.title);
    this.updateTags(strings);
    this.reloadTagsString();
  }

  removeTag(tag) {
    const strings = this.state.note.tags.map((currentTag) => {
      return currentTag.title;
    }).filter((title) => {
      return title !== tag.title;
    });
    this.updateTags(strings);
    this.reloadTagsString();
  }

  updateTag(stringTags) {
    const toRemove = [];
    for (const tag of this.state.note.tags) {
      if (stringTags.indexOf(tag.title) === -1) {
        toRemove.push(tag);
      }
    }
    for (const tagToRemove of toRemove) {
      tagToRemove.removeItemAsRelationship(this.state.note);
    }
    this.modelManager.setItemsDirty(toRemove);
    const tags = [];
    for (const tagString of stringTags) {
      const existingRelationship = _.find(
        this.state.note.tags,
        { title: tagString }
      );
      if (!existingRelationship) {
        tags.push(
          this.modelManager.findOrCreateTagByTitle(tagString)
        );
      }
    }
    for (const tag of tags) {
      tag.addItemAsRelationship(this.state.note);
    }
    this.modelManager.setItemsDirty(tags);
    this.syncManager.sync();
  }

  updateTagsFromTagsString() {
    if (this.state.tagsString === this.state.note.tagsString()) {
      return;
    }
    const strings = this.state.tagsString.split('#').filter((string) => {
      return string.length > 0;
    }).map((string) => {
      return string.trim();
    });
    this.state.note.dummy = false;
    this.updateTags(strings);
  }

  onPanelResizeFinish = (width, left, isMaxWidth) => {
    if (isMaxWidth) {
      this.preferencesManager.setUserPrefValue(
        PREF_EDITOR_WIDTH,
        null
      );
    } else {
      if (width !== undefined && width !== null) {
        this.preferencesManager.setUserPrefValue(
          PREF_EDITOR_WIDTH,
          width
        );
        this.leftResizeControl.setWidth(width);
      }
    }
    if (left !== undefined && left !== null) {
      this.preferencesManager.setUserPrefValue(
        PREF_EDITOR_LEFT,
        left
      );
      this.rightResizeControl.setLeft(left);
    }
    this.preferencesManager.syncUserPreferences();
  }

  loadPreferences() {
    const monospaceEnabled = this.preferencesManager.getValue(
      PREF_EDITOR_MONOSPACE_ENABLED,
      true
    );
    const spellcheck = this.preferencesManager.getValue(
      PREF_EDITOR_SPELLCHECK,
      true
    );
    const marginResizersEnabled = this.preferencesManager.getValue(
      PREF_EDITOR_RESIZERS_ENABLED,
      true
    );
    this.setState({
      monospaceEnabled,
      spellcheck,
      marginResizersEnabled
    });

    if (!document.getElementById(ELEMENT_ID_EDITOR_CONTENT)) {
      /** Elements have not yet loaded due to ng-if around wrapper */
      return;
    }

    this.reloadFont();

    if (this.state.marginResizersEnabled) {
      const width = this.preferencesManager.getValue(
        PREF_EDITOR_WIDTH,
        null
      );
      if (width != null) {
        this.leftResizeControl.setWidth(width);
        this.rightResizeControl.setWidth(width);
      }
      const left = this.preferencesManager.getValue(
        PREF_EDITOR_LEFT,
        null
      );
      if (left != null) {
        this.leftResizeControl.setLeft(left);
        this.rightResizeControl.setLeft(left);
      }
    }
  }

  reloadFont() {
    const editor = document.getElementById(
      ELEMENT_ID_NOTE_TEXT_EDITOR
    );
    if (!editor) {
      return;
    }
    if (this.state.monospaceEnabled) {
      if (this.state.isDesktop) {
        editor.style.fontFamily = DESKTOP_MONOSPACE_FAMILY;
      } else {
        editor.style.fontFamily = WEB_MONOSPACE_FAMILY;
      }
    } else {
      editor.style.fontFamily = SANS_SERIF_FAMILY;
    }
  }

  async toggleKey(key) {
    this[key] = !this[key];
    this.preferencesManager.setUserPrefValue(
      key,
      this[key],
      true
    );
    this.reloadFont();

    if (key === PREF_EDITOR_SPELLCHECK) {
      /** Allows textarea to reload */
      await this.setState({
        noteReady: false
      });
      this.setState({
        noteReady: true
      });
      this.reloadFont();
    } else if (key === PREF_EDITOR_RESIZERS_ENABLED && this[key] === true) {
      this.$timeout(() => {
        this.leftResizeControl.flash();
        this.rightResizeControl.flash();
      });
    }
  }

  /** @components */

  onEditorLoad = (editor) => {
    this.desktopManager.redoSearch();
  }

  registerComponentHandler() {
    this.componentManager.registerHandler({
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
                ELEMENT_ID_NOTE_TAGS_COMPONENT_CONTAINER
              );
              setSize(container, data);
            }
          }
        }
        else if (action === 'associate-item') {
          if (data.item.content_type === 'Tag') {
            const tag = this.modelManager.findItem(data.item.uuid);
            this.addTag(tag);
          }
        }
        else if (action === 'deassociate-item') {
          const tag = this.modelManager.findItem(data.item.uuid);
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
    const components = this.componentManager.componentsForArea('editor-stack')
      .sort((a, b) => {
        return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
      });

    this.setState({
      state: components
    });
  }

  reloadComponentContext() {
    this.reloadComponentStackArray();
    if (this.state.note) {
      for (const component of this.state.componentStack) {
        if (component.active) {
          this.componentManager.setComponentHidden(
            component,
            !component.isExplicitlyEnabledForItem(this.state.note)
          );
        }
      }
    }

    this.componentManager.contextItemDidChangeInArea('note-tags');
    this.componentManager.contextItemDidChangeInArea('editor-stack');
    this.componentManager.contextItemDidChangeInArea('editor-editor');
  }

  toggleStackComponentForCurrentItem(component) {
    if (component.hidden || !component.active) {
      this.componentManager.setComponentHidden(component, false);
      this.associateComponentWithCurrentNote(component);
      if (!component.active) {
        this.componentManager.activateComponent(component);
      }
      this.componentManager.contextItemDidChangeInArea('editor-stack');
    } else {
      this.componentManager.setComponentHidden(component, true);
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

    this.modelManager.setItemDirty(component);
    this.syncManager.sync();
  }

  associateComponentWithCurrentNote(component) {
    component.disassociatedItemIds = component.disassociatedItemIds
      .filter((id) => {
        return id !== this.state.note.uuid;
      });

    if (!component.associatedItemIds.includes(this.state.note.uuid)) {
      component.associatedItemIds.push(this.state.note.uuid);
    }

    this.modelManager.setItemDirty(component);
    this.syncManager.sync();
  }

  registerKeyboardShortcuts() {
    this.altKeyObserver = this.keyboardManager.addKeyObserver({
      modifiers: [
        KeyboardManager.KeyModifierAlt
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

    this.trashKeyObserver = this.keyboardManager.addKeyObserver({
      key: KeyboardManager.KeyBackspace,
      notElementIds: [
        ELEMENT_ID_NOTE_TEXT_EDITOR,
        ELEMENT_ID_NOTE_TITLE_EDITOR
      ],
      modifiers: [KeyboardManager.KeyModifierMeta],
      onKeyDown: () => {
        this.deleteNote();
      },
    });

    this.deleteKeyObserver = this.keyboardManager.addKeyObserver({
      key: KeyboardManager.KeyBackspace,
      modifiers: [
        KeyboardManager.KeyModifierMeta,
        KeyboardManager.KeyModifierShift,
        KeyboardManager.KeyModifierAlt
      ],
      onKeyDown: (event) => {
        event.preventDefault();
        this.deleteNote(true);
      },
    });
  }

  onSystemEditorLoad() {
    if (this.loadedTabListener) {
      return;
    }
    this.loadedTabListener = true;
    /**
     * Insert 4 spaces when a tab key is pressed,
     * only used when inside of the text editor.
     * If the shift key is pressed first, this event is
     * not fired.
    */
    const editor = document.getElementById(
      ELEMENT_ID_NOTE_TEXT_EDITOR
    );
    this.tabObserver = this.keyboardManager.addKeyObserver({
      element: editor,
      key: KeyboardManager.KeyTab,
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
    angular.element(editor).on('$destroy', () => {
      if (this.tabObserver) {
        this.keyboardManager.removeKeyObserver(this.tabObserver);
        this.loadedTabListener = false;
      }
    });
  };
}

export class EditorPanel {
  constructor() {
    this.restrict = 'E';
    this.scope = {};
    this.template = template;
    this.replace = true;
    this.controller = EditorCtrl;
    this.controllerAs = 'self';
    this.bindToController = true;
  }
}
