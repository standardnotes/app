import {
  SNNote,
  SNSmartTag,
  ContentTypes,
  ApplicationEvents,
  ComponentActions
} from 'snjs';
import template from '%/tags.pug';
import { AppStateEvents } from '@/services/state';
import { PANEL_NAME_TAGS } from '@/controllers/constants';
import { PrefKeys } from '@/services/preferencesManager';
import { STRING_DELETE_TAG } from '@/strings';
import { PureCtrl } from '@Controllers';

class TagsPanelCtrl extends PureCtrl {
  /* @ngInject */
  constructor(
    $timeout,
  ) {
    super($timeout);
    this.panelPuppet = {
      onReady: () => this.loadPreferences()
    };
  }

  deinit() {
    this.unregisterComponent();
    this.unregisterComponent = null;
    super.deinit();
  }

  getInitialState() {
    return {
      tags: [],
      smartTags: [],
      noteCounts: {},
    };
  }

  onAppStart() {
    super.onAppStart();
    this.registerComponentHandler();
  }

  onAppLaunch() {
    super.onAppLaunch();
    this.loadPreferences();
    this.beginStreamingItems();
    const smartTags = this.application.getSmartTags();
    this.setState({
      smartTags: smartTags,
    });
    this.selectTag(smartTags[0]);
  }

  /** @override */
  onAppSync() {
    super.onAppSync();
    this.reloadNoteCounts();
  }

  /**
   * Returns all officially saved tags as reported by the model manager.
   * @access private
   */
  getMappedTags() {
    const tags = this.application.getItems({ contentType: ContentTypes.Tag });
    return tags.sort((a, b) => {
      return a.content.title < b.content.title ? -1 : 1;
    });
  }

  beginStreamingItems() {
    this.application.streamItems({
      contentType: ContentTypes.Tag,
      stream: async ({ items }) => {
        await this.setState({
          tags: this.getMappedTags(),
          smartTags: this.application.getSmartTags(),
        });
        this.reloadNoteCounts();
        if (this.state.selectedTag) {
          /** If the selected tag has been deleted, revert to All view. */
          const matchingTag = items.find((tag) => {
            return tag.uuid === this.state.selectedTag.uuid;
          });
          if (!matchingTag || matchingTag.deleted) {
            this.selectTag(this.state.smartTags[0]);
          }
        }
      }
    });
  }

  /** @override */
  onAppStateEvent(eventName, data) {
    if (eventName === AppStateEvents.PreferencesChanged) {
      this.loadPreferences();
    } else if (eventName === AppStateEvents.TagChanged) {
      this.setState({
        selectedTag: this.application.getAppState().getSelectedTag()
      });
    }
  }


  /** @override */
  async onAppEvent(eventName) {
    super.onAppEvent(eventName);
    if (eventName === ApplicationEvents.LocalDataIncrementalLoad) {
      this.reloadNoteCounts();
    } else if (eventName === ApplicationEvents.SyncStatusChanged) {
      const syncStatus = this.application.getSyncStatus();
      const stats = syncStatus.getStats();
      if (stats.downloadCount > 0) {
        this.reloadNoteCounts();
      }
    }
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
    if (!this.panelPuppet.ready) {
      return;
    }
    const width = this.application.getPrefsService().getValue(PrefKeys.TagsPanelWidth);
    if (width) {
      this.panelPuppet.setWidth(width);
      if (this.panelPuppet.isCollapsed()) {
        this.application.getAppState().panelDidResize({
          name: PANEL_NAME_TAGS,
          collapsed: this.panelPuppet.isCollapsed()
        });
      }
    }
  }

  onPanelResize = (newWidth, lastLeft, isAtMaxWidth, isCollapsed) => {
    this.application.getPrefsService().setUserPrefValue(
      PrefKeys.TagsPanelWidth,
      newWidth,
      true
    );
    this.application.getAppState().panelDidResize({
      name: PANEL_NAME_TAGS,
      collapsed: isCollapsed
    });
  }

  registerComponentHandler() {
    this.unregisterComponent = this.application.componentManager.registerHandler({
      identifier: 'tags',
      areas: ['tags-list'],
      activationHandler: (component) => {
        this.component = component;
      },
      contextRequestHandler: (component) => {
        return null;
      },
      actionHandler: (_, action, data) => {
        if (action === ComponentActions.SelectItem) {
          if (data.item.content_type === ContentTypes.Tag) {
            const tag = this.application.findItem({ uuid: data.item.uuid });
            if (tag) {
              this.selectTag(tag);
            }
          } else if (data.item.content_type === ContentTypes.SmartTag) {
            this.application.createTemplateItem({
              contentType: ContentTypes.SmartTag,
              content: data.item.content
            }).then(smartTag => {
              this.selectTag(smartTag);
            });
          }
        } else if (action === ComponentActions.ClearSelection) {
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
    this.application.getAppState().setSelectedTag(tag);
  }

  async clickedAddNewTag() {
    if (this.state.editingTag) {
      return;
    }
    const newTag = await this.application.createTemplateItem({
      contentType: ContentTypes.Tag
    });
    this.setState({
      tags: [newTag].concat(this.state.tags),
      previousTag: this.state.selectedTag,
      selectedTag: newTag,
      editingTag: newTag,
      newTag: newTag
    });
  }

  tagTitleDidChange(tag) {
    this.setState({
      editingTag: tag
    });
  }

  async saveTag($event, tag) {
    $event.target.blur();
    await this.setState({
      editingTag: null,
    });

    if (!tag.title || tag.title.length === 0) {
      let newSelectedTag = this.state.selectedTag;
      if (this.state.editingTag) {
        tag.title = this.editingOriginalName;
        this.editingOriginalName = null;
      } else if (this.state.newTag) {
        newSelectedTag = this.state.previousTag;
      }
      this.setState({
        newTag: null,
        selectedTag: newSelectedTag,
        tags: this.getMappedTags()
      });
      return;
    }

    this.editingOriginalName = null;

    const matchingTag = this.application.findTag({ title: tag.title });
    const alreadyExists = matchingTag && matchingTag !== tag;
    if (this.state.newTag === tag && alreadyExists) {
      this.application.alertService.alert({
        text: "A tag with this name already exists."
      });
      this.setState({
        newTag: null,
        tags: this.getMappedTags(),
        selectedTag: this.state.previousTag
      });
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
  }

  removeTag(tag) {
    this.application.alertService.confirm({
      text: STRING_DELETE_TAG,
      destructive: true,
      onConfirm: () => {
        this.application.deleteItem({ item: tag });
        this.selectTag(this.state.smartTags[0]);
      }
    });
  }
}

export class TagsPanel {
  constructor() {
    this.restrict = 'E';
    this.scope = {
      application: '='
    };
    this.template = template;
    this.replace = true;
    this.controller = TagsPanelCtrl;
    this.controllerAs = 'self';
    this.bindToController = true;
  }
}
