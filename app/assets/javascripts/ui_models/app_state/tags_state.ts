import { confirmDialog } from '@/services/alertService';
import { STRING_DELETE_TAG } from '@/strings';
import {
  ComponentAction,
  ContentType,
  MessageData,
  SNApplication,
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
import { FeaturesState, SMART_TAGS_FEATURE_NAME } from './features_state';

type AnyTag = SNTag | SNSmartTag;

const rootTags = (application: SNApplication): SNTag[] => {
  const hasNoParent = (tag: SNTag) => !application.getTagParent(tag);

  const allTags = application.getDisplayableItems(ContentType.Tag) as SNTag[];
  const rootTags = allTags.filter(hasNoParent);

  return rootTags;
};

const tagSiblings = (application: SNApplication, tag: SNTag): SNTag[] => {
  const withoutCurrentTag = (tags: SNTag[]) =>
    tags.filter((other) => other.uuid !== tag.uuid);

  const isTemplateTag = application.isTemplateItem(tag);
  const parentTag = !isTemplateTag && application.getTagParent(tag);

  if (parentTag) {
    const siblingsAndTag = application.getTagChildren(parentTag);
    return withoutCurrentTag(siblingsAndTag);
  }

  return withoutCurrentTag(rootTags(application));
};

const isValidFutureSiblings = (
  application: SNApplication,
  futureSiblings: SNTag[],
  tag: SNTag
): boolean => {
  const siblingWithSameName = futureSiblings.find(
    (otherTag) => otherTag.title === tag.title
  );

  if (siblingWithSameName) {
    application.alertService?.alert(
      `A tag with the name ${tag.title} already exists at this destination. Please rename this tag before moving and try again.`
    );
    return false;
  }
  return true;
};

export class TagsState {
  tags: SNTag[] = [];
  smartTags: SNSmartTag[] = [];
  allNotesCount_ = 0;
  selected_: AnyTag | undefined;
  previouslySelected_: AnyTag | undefined;
  editing_: SNTag | undefined;

  private readonly tagsCountsState: TagsCountsState;

  constructor(
    private application: WebApplication,
    appEventListeners: (() => void)[],
    private features: FeaturesState
  ) {
    this.tagsCountsState = new TagsCountsState(this.application);

    this.selected_ = undefined;
    this.previouslySelected_ = undefined;
    this.editing_ = undefined;

    this.smartTags = this.application.getSmartTags();
    this.selected_ = this.smartTags[0];

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
      selectedUuid: computed,
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

    appEventListeners.push(
      this.application.addNoteCountChangeObserver((tagUuid) => {
        if (!tagUuid) {
          runInAction(() => {
            this.allNotesCount_ = this.application.allCountableNotesCount();
          });
        } else {
          this.tagsCountsState.update([
            this.application.findItem(tagUuid) as SNTag,
          ]);
        }
      })
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

  public hasParent(tagUuid: UuidString): boolean {
    const item = this.application.findItem(tagUuid);
    return !!item && !!(item as SNTag).parentId;
  }

  public async assignParent(
    tagUuid: string,
    futureParentUuid: string | undefined
  ): Promise<void> {
    const tag = this.application.findItem(tagUuid) as SNTag;

    const currentParent = this.application.getTagParent(tag);
    const currentParentUuid = currentParent?.uuid;

    if (currentParentUuid === futureParentUuid) {
      return;
    }

    const futureParent =
      futureParentUuid &&
      (this.application.findItem(futureParentUuid) as SNTag);

    if (!futureParent) {
      const futureSiblings = rootTags(this.application);
      if (!isValidFutureSiblings(this.application, futureSiblings, tag)) {
        return;
      }
      await this.application.unsetTagParent(tag);
    } else {
      const futureSiblings = this.application.getTagChildren(futureParent);
      if (!isValidFutureSiblings(this.application, futureSiblings, tag)) {
        return;
      }
      await this.application.setTagParent(futureParent, tag);
    }

    await this.application.sync();
  }

  get rootTags(): SNTag[] {
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

  public get selectedUuid(): UuidString | undefined {
    return this.selected_?.uuid;
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

    const siblings = tagSiblings(this.application, tag);
    const hasDuplicatedTitle = siblings.some(
      (other) => other.title.toLowerCase() === newTitle.toLowerCase()
    );

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
      const isSmartTagTitle = this.application.isSmartTagTitle(newTitle);

      if (isSmartTagTitle) {
        if (!this.features.hasSmartTags) {
          await this.features.showPremiumAlert(SMART_TAGS_FEATURE_NAME);
          return;
        }
      }

      const insertedTag = await this.application.createTagOrSmartTag(newTitle);
      this.application.sync();
      runInAction(() => {
        this.selected = insertedTag as SNTag;
      });
    } else {
      await this.application.changeAndSaveItem<TagMutator>(
        tag.uuid,
        (mutator) => {
          mutator.title = newTitle;
        }
      );
    }
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
      }
    } else if (action === ComponentAction.ClearSelection) {
      this.selected = this.smartTags[0];
    }
  }

  public get hasAtLeastOneFolder(): boolean {
    return this.tags.some((tag) => !!this.application.getTagParent(tag));
  }
}

class TagsCountsState {
  public counts: { [uuid: string]: number } = {};

  public constructor(private application: WebApplication) {
    makeAutoObservable(this, {
      counts: observable.ref,
      update: action,
    });
  }

  public update(tags: SNTag[]) {
    const newCounts: { [uuid: string]: number } = Object.assign(
      {},
      this.counts
    );

    tags.forEach((tag) => {
      newCounts[tag.uuid] = this.application.countableNotesForTag(tag);
    });

    this.counts = newCounts;
  }
}
