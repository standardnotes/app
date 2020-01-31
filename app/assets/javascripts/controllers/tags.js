import { SNNote, SNSmartTag } from 'snjs';
import template from '%/tags.pug';
import {
  APP_STATE_EVENT_PREFERENCES_CHANGED,
  APP_STATE_EVENT_TAG_CHANGED
} from '@/state';
import { PANEL_NAME_TAGS } from '@/controllers/constants';
import { PREF_TAGS_PANEL_WIDTH } from '@/services/preferencesManager';
import { STRING_DELETE_TAG } from '@/strings';
import { PureCtrl } from '@Controllers';

class TagsPanelCtrl extends PureCtrl {
  /* @ngInject */
  constructor(
    $rootScope,
    $timeout,
    alertManager,
    appState,
    componentManager,
    modelManager,
    preferencesManager,
    syncManager,
  ) {
    super($timeout);
    this.$rootScope = $rootScope;
    this.alertManager = alertManager;
    this.appState = appState;
    this.componentManager = componentManager;
    this.modelManager = modelManager;
    this.preferencesManager = preferencesManager;
    this.syncManager = syncManager;
    this.panelController = {};
    this.addSyncEventHandler();
    this.addAppStateObserver();
    this.addMappingObserver();
    this.loadPreferences();
    this.registerComponentHandler();
    this.state = {
      smartTags: this.modelManager.getSmartTags(),
      noteCounts: {}
    };
  }

  $onInit() {
    this.selectTag(this.state.smartTags[0]);
  }

  addSyncEventHandler() {
    this.syncManager.addEventHandler(async (syncEvent, data) => {
      if (
        syncEvent === 'local-data-loaded' ||
        syncEvent === 'sync:completed' ||
        syncEvent === 'local-data-incremental-load'
      ) {
        await this.setState({
          tags: this.modelManager.tags,
          smartTags: this.modelManager.getSmartTags()
        });
        this.reloadNoteCounts();
      }
    });
  }

  addAppStateObserver() {
    this.appState.addObserver((eventName, data) => {
      if (eventName === APP_STATE_EVENT_PREFERENCES_CHANGED) {
        this.loadPreferences();
      } else if (eventName === APP_STATE_EVENT_TAG_CHANGED) {
        this.setState({
          selectedTag: this.appState.getSelectedTag()
        });
      }
    });
  }

  addMappingObserver() {
    this.modelManager.addItemSyncObserver(
      'tags-list-tags',
      'Tag',
      (allItems, validItems, deletedItems, source, sourceKey) => {
        this.reloadNoteCounts();

        if (!this.state.selectedTag) {
          return;
        }
        /** If the selected tag has been deleted, revert to All view. */
        const selectedTag = allItems.find((tag) => {
          return tag.uuid === this.state.selectedTag.uuid;
        });
        if (selectedTag && selectedTag.deleted) {
          this.selectTag(this.state.smartTags[0]);
        }
      }
    );
  }

  reloadNoteCounts() {
    let allTags = [];
    if (this.state.tags) {
      allTags = allTags.concat(this.state.tags);
    }
    if (this.state.smartTags) {
      allTags = allTags.concat(this.state.smartTags);
    }
    const noteCounts = {};
    for (const tag of allTags) {
      const validNotes = SNNote.filterDummyNotes(tag.notes).filter((note) => {
        return !note.archived && !note.content.trashed;
      });
      noteCounts[tag.uuid] = validNotes.length;
    }
    this.setState({
      noteCounts: noteCounts
    });
  }

  loadPreferences() {
    const width = this.preferencesManager.getValue(PREF_TAGS_PANEL_WIDTH);
    if (width) {
      this.panelController.setWidth(width);
      if (this.panelController.isCollapsed()) {
        this.appState.panelDidResize({
          name: PANEL_NAME_TAGS,
          collapsed: this.panelController.isCollapsed()
        });
      }
    }
  }

  onPanelResize = (newWidth, lastLeft, isAtMaxWidth, isCollapsed) => {
    this.preferencesManager.setUserPrefValue(
      PREF_TAGS_PANEL_WIDTH,
      newWidth,
      true
    );
    this.appState.panelDidResize({
      name: PANEL_NAME_TAGS,
      collapsed: isCollapsed
    });
  }

  registerComponentHandler() {
    this.componentManager.registerHandler({
      identifier: 'tags',
      areas: ['tags-list'],
      activationHandler: (component) => {
        this.component = component;
      },
      contextRequestHandler: (component) => {
        return null;
      },
      actionHandler: (component, action, data) => {
        if (action === 'select-item') {
          if (data.item.content_type === 'Tag') {
            const tag = this.modelManager.findItem(data.item.uuid);
            if (tag) {
              this.selectTag(tag);
            }
          } else if (data.item.content_type === 'SN|SmartTag') {
            const smartTag = new SNSmartTag(data.item);
            this.selectTag(smartTag);
          }
        } else if (action === 'clear-selection') {
          this.selectTag(this.state.smartTags[0]);
        }
      }
    });
  }

  async selectTag(tag) {
    if (tag.isSmartTag()) {
      Object.defineProperty(tag, 'notes', {
        get: () => {
          return this.modelManager.notesMatchingSmartTag(tag);
        }
      });
    }
    if (tag.content.conflict_of) {
      tag.content.conflict_of = null;
      this.modelManager.setItemDirty(tag);
      this.syncManager.sync();
    }
    this.appState.setSelectedTag(tag);
  }

  clickedAddNewTag() {
    if (this.state.editingTag) {
      return;
    }
    const newTag = this.modelManager.createItem({
      content_type: 'Tag'
    });
    this.setState({
      previousTag: this.state.selectedTag,
      selectedTag: newTag,
      editingTag: newTag,
      newTag: newTag
    });
    this.modelManager.addItem(newTag);
  }

  tagTitleDidChange(tag) {
    this.setState({
      editingTag: tag
    });
  }

  async saveTag($event, tag) {
    $event.target.blur();
    await this.setState({ 
      editingTag: null 
    });
    if (!tag.title || tag.title.length === 0) {
      if (this.state.editingTag) {
        tag.title = this.editingOriginalName;
        this.editingOriginalName = null;
      } else if(this.state.newTag) {
        this.modelManager.removeItemLocally(tag);
        this.setState({
          selectedTag: this.state.previousTag
        });
      }
      this.setState({ newTag: null });
      return;
    }
   
    this.editingOriginalName = null;

    const matchingTag = this.modelManager.findTag(tag.title);
    if (this.state.newTag === tag && matchingTag) {
      this.alertManager.alert({
        text: "A tag with this name already exists."
      });
      this.modelManager.removeItemLocally(tag);
      this.setState({ newTag: null });
      return;
    }

    this.modelManager.setItemDirty(tag);
    this.syncManager.sync();
    this.modelManager.resortTag(tag);
    this.selectTag(tag);
    this.setState({
      newTag: null
    });
  }

  async selectedRenameTag($event, tag) {
    this.editingOriginalName = tag.title;
    await this.setState({
      editingTag: tag
    });
    document.getElementById('tag-' + tag.uuid).focus();
  }

  selectedDeleteTag(tag) {
    this.removeTag(tag);
    this.selectTag(this.state.smartTags[0]);
  }

  removeTag(tag) {
    this.alertManager.confirm({
      text: STRING_DELETE_TAG,
      destructive: true,
      onConfirm: () => {
        this.modelManager.setItemToBeDeleted(tag);
        this.syncManager.sync().then(() => {
          this.$rootScope.safeApply();
        });
      }
    });
  }
}

export class TagsPanel {
  constructor() {
    this.restrict = 'E';
    this.scope = {};
    this.template = template;
    this.replace = true;
    this.controller = TagsPanelCtrl;
    this.controllerAs = 'self';
    this.bindToController = true;
  }
}
