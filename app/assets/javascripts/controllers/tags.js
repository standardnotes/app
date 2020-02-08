import { SNNote, SNSmartTag, ContentTypes } from 'snjs';
import template from '%/tags.pug';
import { AppStateEvents } from '@/state';
import { PANEL_NAME_TAGS } from '@/controllers/constants';
import { PrefKeys } from '@/services/preferencesManager';
import { STRING_DELETE_TAG } from '@/strings';
import { PureCtrl } from '@Controllers';

class TagsPanelCtrl extends PureCtrl {
  /* @ngInject */
  constructor(
    $rootScope,
    $timeout,
    application,
    appState,
    preferencesManager
  ) {
    super($timeout);
    this.$rootScope = $rootScope;
    this.application = application;
    this.appState = appState;
    this.preferencesManager = preferencesManager;
    this.panelController = {};
    this.beginStreamingItems();
    this.addAppStateObserver();
    this.loadPreferences();
    this.registerComponentHandler();
    this.state = {
      smartTags: this.application.getSmartTags(),
      noteCounts: {}
    };
  }

  $onInit() {
    this.selectTag(this.state.smartTags[0]);
  }

  beginStreamingItems() {
    this.application.streamItems({
      contentType: ContentTypes.Tag,
      stream: async ({ items }) => {
        await this.setState({
          tags: this.application.getItems({ contentType: ContentTypes.Tag }),
          smartTags: this.application.getItems({ contentType: ContentTypes.SmartTag }),
        });
        this.reloadNoteCounts();
        if (this.state.selectedTag) {
          /** If the selected tag has been deleted, revert to All view. */
          const selectedTag = items.find((tag) => {
            return tag.uuid === this.state.selectedTag.uuid;
          });
          if (selectedTag && selectedTag.deleted) {
            this.selectTag(this.state.smartTags[0]);
          }
        }
      }
    });
  }

  addAppStateObserver() {
    this.appState.addObserver((eventName, data) => {
      if (eventName === AppStateEvents.PreferencesChanged) {
        this.loadPreferences();
      } else if (eventName === AppStateEvents.TagChanged) {
        this.setState({
          selectedTag: this.appState.getSelectedTag()
        });
      }
    });
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
    const width = this.preferencesManager.getValue(PrefKeys.TagsPanelWidth);
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
      PrefKeys.TagsPanelWidth,
      newWidth,
      true
    );
    this.appState.panelDidResize({
      name: PANEL_NAME_TAGS,
      collapsed: isCollapsed
    });
  }

  registerComponentHandler() {
    this.application.componentManager.registerHandler({
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
            const tag = this.application.findItem({ uuid: data.item.uuid });
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
          return this.application.getNotesMatchingSmartTag({
            smartTag: tag
          });
        }
      });
    }
    if (tag.content.conflict_of) {
      tag.content.conflict_of = null;
      this.application.saveItem({ item: tag });
    }
    this.appState.setSelectedTag(tag);
  }

  clickedAddNewTag() {
    if (this.state.editingTag) {
      return;
    }
    const newTag = this.application.createItem({
      contentType: ContentTypes.Tag
    });
    this.setState({
      previousTag: this.state.selectedTag,
      selectedTag: newTag,
      editingTag: newTag,
      newTag: newTag
    });
    /** @todo Should not be accessing internal function */
    /** Rely on local state instead of adding to global state */
    this.application.modelManager.insertItems({ items: [newTag] });
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
      } else if (this.state.newTag) {
        /** @todo Should not be accessing internal function */
        /** Rely on local state instead of adding to global state */
        this.application.modelManager.removeItemLocally(tag);
        this.setState({
          selectedTag: this.state.previousTag
        });
      }
      this.setState({ newTag: null });
      return;
    }

    this.editingOriginalName = null;

    const matchingTag = this.application.findTag({ title: tag.title });
    const alreadyExists = matchingTag && matchingTag !== tag;
    if (this.state.newTag === tag && alreadyExists) {
      this.application.alertManager.alert({
        text: "A tag with this name already exists."
      });
      /** @todo Should not be accessing internal function */
      /** Rely on local state instead of adding to global state */
      this.application.modelManager.removeItemLocally(tag);
      this.setState({ newTag: null });
      return;
    }

    this.application.saveItem({ item: tag });
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
    this.application.alertManager.confirm({
      text: STRING_DELETE_TAG,
      destructive: true,
      onConfirm: () => {
        this.application.deleteItem({ item: tag });
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
