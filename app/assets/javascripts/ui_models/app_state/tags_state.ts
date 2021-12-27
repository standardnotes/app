import { confirmDialog } from '@/services/alertService';
import { STRING_DELETE_TAG } from '@/strings';
import {
  ComponentAction,
  ContentType,
  MessageData,
  SNSmartTag,
  SNTag,
  TagMutator,
  UuidString,
} from '@standardnotes/snjs';
import {
  action,
  computed,
  makeAutoObservable,
  makeObservable,
  observable,
  runInAction,
} from 'mobx';
import { WebApplication } from '../application';
import { FeaturesState } from './features_state';

type AnyTag = SNTag | SNSmartTag;

type Disposer = () => void;

export class TagsState {
  tags: SNTag[] = [];
  smartTags: SNSmartTag[] = [];
  allNotesCount_ = 0;
  selected_: AnyTag | undefined;
  previouslySelected_: AnyTag | undefined;
  editing_: SNTag | undefined;

  private readonly tagsCountsState: TagsCountsState;

  private readonly unregisterComponentHandler: Disposer;

  constructor(
    private application: WebApplication,
    appEventListeners: (() => void)[],
    private features: FeaturesState
  ) {
    this.tagsCountsState = new TagsCountsState(this.application);

    this.selected_ = undefined;
    this.previouslySelected_ = undefined;
    this.editing_ = undefined;

    makeObservable(this, {
      tags: observable.ref,
      smartTags: observable.ref,
      hasAtLeastOneFolder: computed,
      allNotesCount_: observable,
      allNotesCount: computed,

      selected_: observable.ref,
      previouslySelected_: observable.ref,
      previouslySelected: computed,
      editing_: observable.ref,
      selected: computed,
      editingTag: computed,

      assignParent: action,

      rootTags: computed,
      tagsCount: computed,

      createNewTemplate: action,
      undoCreateNewTag: action,
      save: action,
      remove: action,
    });

    appEventListeners.push(
      this.application.streamItems(
        [ContentType.Tag, ContentType.SmartTag],
        (items) => {
          runInAction(() => {
            this.tags = this.application.getDisplayableItems(
              ContentType.Tag
            ) as SNTag[];
            this.smartTags = this.application.getSmartTags();

            this.tagsCountsState.update(this.tags);
            this.allNotesCount_ = this.countAllNotes();

            const selectedTag = this.selected_;
            if (selectedTag) {
              const matchingTag = items.find(
                (candidate) => candidate.uuid === selectedTag.uuid
              );
              if (matchingTag) {
                if (matchingTag.deleted) {
                  this.selected_ = this.smartTags[0];
                } else {
                  this.selected_ = matchingTag as AnyTag;
                }
              }
            } else {
              this.selected_ = this.smartTags[0];
            }
          });
        }
      )
    );
  }

  public get allLocalRootTags(): SNTag[] {
    if (this.editing_ && this.application.isTemplateItem(this.editing_)) {
      return [this.editing_, ...this.rootTags];
    }
    return this.rootTags;
  }

  public getNotesCount(tag: SNTag): number {
    return this.tagsCountsState.counts[tag.uuid] || 0;
  }

  getChildren(tag: SNTag): SNTag[] {
    if (!this.features.hasFolders) {
      return [];
    }

    if (this.application.isTemplateItem(tag)) {
      return [];
    }

    const children = this.application
      .getTagChildren(tag)
      .filter((tag) => !tag.isSmartTag);

    const childrenUuids = children.map((childTag) => childTag.uuid);
    const childrenTags = this.tags.filter((tag) =>
      childrenUuids.includes(tag.uuid)
    );
    return childrenTags;
  }

  isValidTagParent(parentUuid: UuidString, tagUuid: UuidString): boolean {
    return this.application.isValidTagParent(parentUuid, tagUuid);
  }

  public async assignParent(
    tagUuid: string,
    parentUuid: string | undefined
  ): Promise<void> {
    const tag = this.application.findItem(tagUuid) as SNTag;

    const parent =
      parentUuid && (this.application.findItem(parentUuid) as SNTag);

    if (!parent) {
      await this.application.unsetTagParent(tag);
    } else {
      await this.application.setTagParent(parent, tag);
    }

    await this.application.sync();
  }

  get rootTags(): SNTag[] {
    if (!this.features.hasFolders) {
      return this.tags;
    }

    return this.tags.filter((tag) => !this.application.getTagParent(tag));
  }

  get tagsCount(): number {
    return this.tags.length;
  }

  public get allNotesCount(): number {
    return this.allNotesCount_;
  }

  public get previouslySelected(): AnyTag | undefined {
    return this.previouslySelected_;
  }

  public get selected(): AnyTag | undefined {
    return this.selected_;
  }

  public set selected(tag: AnyTag | undefined) {
    if (tag && tag.conflictOf) {
      this.application.changeAndSaveItem(tag.uuid, (mutator) => {
        mutator.conflictOf = undefined;
      });
    }

    const selectionHasNotChanged = this.selected_?.uuid === tag?.uuid;

    if (selectionHasNotChanged) {
      return;
    }

    this.previouslySelected_ = this.selected_;
    this.selected_ = tag;
  }

  public get editingTag(): SNTag | undefined {
    return this.editing_;
  }

  public set editingTag(editingTag: SNTag | undefined) {
    this.editing_ = editingTag;
    this.selected = editingTag;
  }

  public async createNewTemplate() {
    const isAlreadyEditingATemplate =
      this.editing_ && this.application.isTemplateItem(this.editing_);

    if (isAlreadyEditingATemplate) {
      return;
    }

    const newTag = (await this.application.createTemplateItem(
      ContentType.Tag
    )) as SNTag;

    runInAction(() => {
      this.editing_ = newTag;
    });
  }

  public undoCreateNewTag() {
    this.editing_ = undefined;
    const previousTag = this.previouslySelected_ || this.smartTags[0];
    this.selected = previousTag;
  }

  public async remove(tag: SNTag) {
    if (
      await confirmDialog({
        text: STRING_DELETE_TAG,
        confirmButtonStyle: 'danger',
      })
    ) {
      this.application.deleteItem(tag);
      this.selected = this.smartTags[0];
    }
  }

  public async save(tag: SNTag, newTitle: string) {
    const hasEmptyTitle = newTitle.length === 0;
    const hasNotChangedTitle = newTitle === tag.title;
    const isTemplateChange = this.application.isTemplateItem(tag);
    const hasDuplicatedTitle = !!this.application.findTagByTitle(newTitle);

    runInAction(() => {
      this.editing_ = undefined;
    });

    if (hasEmptyTitle || hasNotChangedTitle) {
      if (isTemplateChange) {
        this.undoCreateNewTag();
      }
      return;
    }

    if (hasDuplicatedTitle) {
      if (isTemplateChange) {
        this.undoCreateNewTag();
      }
      this.application.alertService?.alert(
        'A tag with this name already exists.'
      );
      return;
    }

    if (isTemplateChange) {
      if (this.features.enableNativeSmartTagsFeature) {
        const isSmartTagTitle = this.application.isSmartTagTitle(newTitle);

        if (isSmartTagTitle) {
          // TODO: verify premium access
          // TODO: raise a modal alert if needed.
        }
        const insertedTag = await this.application.createTagOrSmartTag(
          newTitle
        );
        runInAction(() => {
          this.selected = insertedTag as SNTag;
        });
      } else {
        // Legacy code, remove me after we enableNativeSmartTagsFeature for everyone.
        const insertedTag = await this.application.insertItem(tag);
        const changedTag = await this.application.changeItem<TagMutator>(
          insertedTag.uuid,
          (m) => {
            m.title = newTitle;
          }
        );
        this.selected = changedTag as SNTag;
        await this.application.saveItem(insertedTag.uuid);
      }
    } else {
      await this.application.changeAndSaveItem<TagMutator>(
        tag.uuid,
        (mutator) => {
          mutator.title = newTitle;
        }
      );
    }
  }

  private countAllNotes(): number {
    const allTag = this.application.getSmartTags().find((tag) => tag.isAllTag);

    if (!allTag) {
      console.error('we are missing a system tag');
      return -1;
    }

    const notes = this.application
      .notesMatchingSmartTag(allTag)
      .filter((note) => {
        return !note.archived && !note.trashed;
      });

    return notes.length;
  }

  public onFoldersComponentMessage(
    action: ComponentAction,
    data: MessageData
  ): void {
    if (action === ComponentAction.SelectItem) {
      const item = data.item;

      if (!item) {
        return;
      }

      if (
        item.content_type === ContentType.Tag ||
        item.content_type === ContentType.SmartTag
      ) {
        const matchingTag = this.application.findItem(item.uuid);

        if (matchingTag) {
          this.selected = matchingTag as AnyTag;
          return;
        }

        // TODO: fix me, we should not need this, we reused the code from old tag view.
        const matchingTagLegacy = this.smartTags.find(
          (tag) => tag.uuid === item.uuid
        );

        if (matchingTagLegacy) {
          this.selected = matchingTagLegacy as AnyTag;
          return;
        }
      }
    } else if (action === ComponentAction.ClearSelection) {
      this.selected = this.smartTags[0];
    }
  }

  public deinit(): void {
    this.unregisterComponentHandler();
  }

  public get hasAtLeastOneFolder(): boolean {
    return this.tags.some((tag) => !!this.application.getTagParent(tag));
  }
}

/**
 * Bug fix for issue 1201550111577311,
 */
class TagsCountsState {
  public counts: { [uuid: string]: number } = {};

  public constructor(private application: WebApplication) {
    makeAutoObservable(this, {
      counts: observable.ref,
      update: action,
    });
  }

  public update(tags: SNTag[]) {
    const newCounts: { [uuid: string]: number } = {};

    tags.forEach((tag) => {
      newCounts[tag.uuid] = this.application.referencesForItem(
        tag,
        ContentType.Note
      ).length;
    });

    this.counts = newCounts;
  }
}
