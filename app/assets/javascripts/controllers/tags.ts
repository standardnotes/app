import { WebDirective, PanelPuppet } from './../types';
import { WebApplication } from './../application';
import {
  SNNote,
  SNTag,
  ContentType,
  ApplicationEvent,
  ComponentAction,
  SNSmartTag,
  ComponentArea,
  SNComponent
} from 'snjs';
import template from '%/tags.pug';
import { AppStateEvent } from '@/services/state';
import { PANEL_NAME_TAGS } from '@/controllers/constants';
import { PrefKeys } from '@/services/preferencesManager';
import { STRING_DELETE_TAG } from '@/strings';
import { PureCtrl } from '@Controllers/abstract/pure_ctrl';
import { UuidString } from '@/../../../../snjs/dist/@types/types';
import { TagMutator } from '@/../../../../snjs/dist/@types/models/app/tag';

type NoteCounts = Partial<Record<string, number>>

class TagsPanelCtrl extends PureCtrl {

  /** Passed through template */
  readonly application!: WebApplication
  private readonly panelPuppet: PanelPuppet
  private unregisterComponent?: any
  component?: SNComponent
  private editingOriginalName?: string
  formData: { tagTitle?: string } = {}
  titles: Partial<Record<UuidString, string>> = {}

  /* @ngInject */
  constructor(
    $timeout: ng.ITimeoutService,
  ) {
    super($timeout);
    this.panelPuppet = {
      onReady: () => this.loadPreferences()
    };
  }

  deinit() {
    this.unregisterComponent();
    this.unregisterComponent = undefined;
    super.deinit();
  }

  getInitialState() {
    return {
      tags: [],
      smartTags: [],
      noteCounts: {},
    };
  }

  async onAppStart() {
    super.onAppStart();
    this.registerComponentHandler();
  }

  async onAppLaunch() {
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
    const tags = this.application.getItems(ContentType.Tag) as SNTag[];
    return tags.sort((a, b) => {
      return a.title < b.title ? -1 : 1;
    });
  }

  beginStreamingItems() {
    this.application.streamItems(
      ContentType.Tag,
      async (items) => {
        await this.setState({
          tags: this.getMappedTags(),
          smartTags: this.application.getSmartTags(),
        });
        this.reloadTitles(items as SNTag[]);
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
    );
  }

  reloadTitles(tags: Array<SNTag | SNSmartTag>) {
    for(const tag of tags) {
      this.titles[tag.uuid] = tag.title;
    }
  }

  /** @override */
  onAppStateEvent(eventName: AppStateEvent, data?: any) {
    if (eventName === AppStateEvent.PreferencesChanged) {
      this.loadPreferences();
    } else if (eventName === AppStateEvent.TagChanged) {
      this.setState({
        selectedTag: this.application.getAppState().getSelectedTag()
      });
    }
  }


  /** @override */
  async onAppEvent(eventName: ApplicationEvent) {
    super.onAppEvent(eventName);
    if (eventName === ApplicationEvent.LocalDataIncrementalLoad) {
      this.reloadNoteCounts();
    } else if (eventName === ApplicationEvent.SyncStatusChanged) {
      const syncStatus = this.application.getSyncStatus();
      const stats = syncStatus.getStats();
      if (stats.downloadCount > 0) {
        this.reloadNoteCounts();
      }
    }
  }

  reloadNoteCounts() {
    let allTags: Array<SNTag | SNSmartTag> = [];
    if (this.state.tags) {
      allTags = allTags.concat(this.state.tags);
    }
    if (this.state.smartTags) {
      allTags = allTags.concat(this.state.smartTags);
    }
    const noteCounts: NoteCounts = {};
    for (const tag of allTags) {
      if (tag.isSmartTag()) {
        const notes = this.application.notesMatchingSmartTag(tag as SNSmartTag);
        noteCounts[tag.uuid] = notes.length;
      } else {
        const notes = this.application.referencesForItem(tag, ContentType.Note)
          .filter((note) => {
            return !note.archived && !note.trashed;
          })
        noteCounts[tag.uuid] = notes.length;
      }
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
      this.panelPuppet.setWidth!(width);
      if (this.panelPuppet.isCollapsed!()) {
        this.application.getAppState().panelDidResize(
          PANEL_NAME_TAGS,
          this.panelPuppet.isCollapsed!()
        );
      }
    }
  }

  onPanelResize = (
    newWidth: number,
    lastLeft: number,
    isAtMaxWidth: boolean,
    isCollapsed: boolean
  ) => {
    this.application.getPrefsService().setUserPrefValue(
      PrefKeys.TagsPanelWidth,
      newWidth,
      true
    );
    this.application.getAppState().panelDidResize(
      PANEL_NAME_TAGS,
      isCollapsed
    );
  }

  registerComponentHandler() {
    this.unregisterComponent = this.application.componentManager!.registerHandler({
      identifier: 'tags',
      areas: [ComponentArea.TagsList],
      activationHandler: (component) => {
        this.component = component;
      },
      contextRequestHandler: () => {
        return undefined;
      },
      actionHandler: (_, action, data) => {
        if (action === ComponentAction.SelectItem) {
          if (data.item.content_type === ContentType.Tag) {
            const tag = this.application.findItem(data.item.uuid);
            if (tag) {
              this.selectTag(tag as SNTag);
            }
          } else if (data.item.content_type === ContentType.SmartTag) {
            this.application.createTemplateItem(
              ContentType.SmartTag,
              data.item.content
            ).then(smartTag => {
              this.selectTag(smartTag as SNSmartTag);
            });
          }
        } else if (action === ComponentAction.ClearSelection) {
          this.selectTag(this.state.smartTags[0]);
        }
      }
    });
  }

  async selectTag(tag: SNTag) {
    if (tag.isSmartTag()) {
      Object.defineProperty(tag, 'notes', {
        get: () => {
          return this.application.notesMatchingSmartTag(tag as SNSmartTag);
        }
      });
    }
    if (tag.conflictOf) {
      this.application.changeAndSaveItem(tag.uuid, (mutator) => {
        mutator.conflictOf = undefined;
      })
    }
    this.application.getAppState().setSelectedTag(tag);
  }

  async clickedAddNewTag() {
    if (this.state.editingTag) {
      return;
    }
    const newTag = await this.application.createTemplateItem(
      ContentType.Tag
    );
    this.setState({
      tags: [newTag].concat(this.state.tags),
      previousTag: this.state.selectedTag,
      selectedTag: newTag,
      editingTag: newTag,
      newTag: newTag
    });
  }

  onTagTitleChange(tag: SNTag | SNSmartTag) {
    this.setState({
      editingTag: tag
    });
  }

  async saveTag($event: Event, tag: SNTag) {
    ($event.target! as HTMLInputElement).blur();
    await this.setState({
      editingTag: null,
    });

    if (!tag.title || tag.title.length === 0) {
      let newSelectedTag = this.state.selectedTag;
      if (this.state.editingTag) {
        this.titles[tag.uuid] = this.editingOriginalName;
        this.editingOriginalName = undefined;
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

    this.editingOriginalName = undefined;

    const matchingTag = this.application.findTagByTitle(tag.title);
    const alreadyExists = matchingTag && matchingTag !== tag;
    if (this.state.newTag === tag && alreadyExists) {
      this.application.alertService!.alert(
        "A tag with this name already exists."
      );
      this.setState({
        newTag: null,
        tags: this.getMappedTags(),
        selectedTag: this.state.previousTag
      });
      return;
    }
    this.application.changeAndSaveItem(tag.uuid, (mutator) => {
      const tagMutator = mutator as TagMutator;
      tagMutator.title = this.titles[tag.uuid]!;
    });
    this.selectTag(tag);
    this.setState({
      newTag: null
    });
  }

  async selectedRenameTag(tag: SNTag) {
    this.editingOriginalName = tag.title;
    await this.setState({
      editingTag: tag
    });
    document.getElementById('tag-' + tag.uuid)!.focus();
  }

  selectedDeleteTag(tag: SNTag) {
    this.removeTag(tag);
  }

  removeTag(tag: SNTag) {
    this.application.alertService!.confirm(
      STRING_DELETE_TAG,
      undefined,
      undefined,
      undefined,
      () => {
        /* On confirm */
        this.application.deleteItem(tag);
        this.selectTag(this.state.smartTags[0]);
      },
      undefined,
      true,
    );
  }
}

export class TagsPanel extends WebDirective {
  constructor() {
    super();
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
