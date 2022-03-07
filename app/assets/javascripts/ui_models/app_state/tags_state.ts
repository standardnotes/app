import { confirmDialog } from '@/services/alertService';
import { STRING_DELETE_TAG } from '@/strings';
import {
  MAX_MENU_SIZE_MULTIPLIER,
  MENU_MARGIN_FROM_APP_BORDER,
} from '@/constants';
import {
  ComponentAction,
  ContentType,
  MessageData,
  SNApplication,
  SmartView,
  SNTag,
  TagMutator,
  UuidString,
  isSystemView,
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

type AnyTag = SNTag | SmartView;

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
  smartViews: SmartView[] = [];
  allNotesCount_ = 0;
  selected_: AnyTag | undefined;
  previouslySelected_: AnyTag | undefined;
  editing_: SNTag | SmartView | undefined;
  addingSubtagTo: SNTag | undefined;

  contextMenuOpen = false;
  contextMenuPosition: { top?: number; left: number; bottom?: number } = {
    top: 0,
    left: 0,
  };
  contextMenuClickLocation: { x: number; y: number } = { x: 0, y: 0 };
  contextMenuMaxHeight: number | 'auto' = 'auto';

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
    this.addingSubtagTo = undefined;

    this.smartViews = this.application.getSmartViews();
    this.selected_ = this.smartViews[0];

    makeObservable(this, {
      tags: observable.ref,
      smartViews: observable.ref,
      hasAtLeastOneFolder: computed,
      allNotesCount_: observable,
      allNotesCount: computed,
      setAllNotesCount: action,

      selected_: observable.ref,
      previouslySelected_: observable.ref,
      previouslySelected: computed,
      editing_: observable.ref,
      selected: computed,
      selectedUuid: computed,
      editingTag: computed,

      addingSubtagTo: observable,
      setAddingSubtagTo: action,

      assignParent: action,

      rootTags: computed,
      tagsCount: computed,

      createNewTemplate: action,
      undoCreateNewTag: action,
      save: action,
      remove: action,

      contextMenuOpen: observable,
      contextMenuPosition: observable,
      contextMenuMaxHeight: observable,
      contextMenuClickLocation: observable,
      setContextMenuOpen: action,
      setContextMenuClickLocation: action,
      setContextMenuPosition: action,
      setContextMenuMaxHeight: action,
    });

    appEventListeners.push(
      this.application.streamItems(
        [ContentType.Tag, ContentType.SmartView],
        (items) => {
          runInAction(() => {
            this.tags = this.application.getDisplayableItems<SNTag>(
              ContentType.Tag
            );
            this.smartViews = this.application.getSmartViews();

            const selectedTag = this.selected_;
            if (selectedTag && !isSystemView(selectedTag as SmartView)) {
              const matchingTag = items.find(
                (candidate) => candidate.uuid === selectedTag.uuid
              ) as AnyTag;
              if (matchingTag) {
                if (matchingTag.deleted) {
                  this.selected_ = this.smartViews[0];
                } else {
                  this.selected_ = matchingTag;
                }
              }
            } else {
              this.selected_ = this.smartViews[0];
            }
          });
        }
      )
    );

    appEventListeners.push(
      this.application.addNoteCountChangeObserver((tagUuid) => {
        if (!tagUuid) {
          this.setAllNotesCount(this.application.allCountableNotesCount());
        } else {
          this.tagsCountsState.update([
            this.application.findItem(tagUuid) as SNTag,
          ]);
        }
      })
    );
  }

  async createSubtagAndAssignParent(parent: SNTag, title: string) {
    const hasEmptyTitle = title.length === 0;

    if (hasEmptyTitle) {
      this.setAddingSubtagTo(undefined);
      return;
    }

    const createdTag = (await this.application.createTagOrSmartView(
      title
    )) as SNTag;

    const futureSiblings = this.application.getTagChildren(parent);

    if (!isValidFutureSiblings(this.application, futureSiblings, createdTag)) {
      this.setAddingSubtagTo(undefined);
      this.remove(createdTag, false);
      return;
    }

    this.assignParent(createdTag.uuid, parent.uuid);

    this.application.sync.sync();

    runInAction(() => {
      this.selected = createdTag as SNTag;
    });

    this.setAddingSubtagTo(undefined);
  }

  setAddingSubtagTo(tag: SNTag | undefined): void {
    this.addingSubtagTo = tag;
  }

  setContextMenuOpen(open: boolean): void {
    this.contextMenuOpen = open;
  }

  setContextMenuClickLocation(location: { x: number; y: number }): void {
    this.contextMenuClickLocation = location;
  }

  setContextMenuPosition(position: {
    top?: number;
    left: number;
    bottom?: number;
  }): void {
    this.contextMenuPosition = position;
  }

  setContextMenuMaxHeight(maxHeight: number | 'auto'): void {
    this.contextMenuMaxHeight = maxHeight;
  }

  reloadContextMenuLayout(): void {
    const { clientHeight } = document.documentElement;
    const defaultFontSize = window.getComputedStyle(
      document.documentElement
    ).fontSize;
    const maxContextMenuHeight =
      parseFloat(defaultFontSize) * MAX_MENU_SIZE_MULTIPLIER;
    const footerElementRect = document
      .getElementById('footer-bar')
      ?.getBoundingClientRect();
    const footerHeightInPx = footerElementRect?.height;

    // Open up-bottom is default behavior
    let openUpBottom = true;

    if (footerHeightInPx) {
      const bottomSpace =
        clientHeight - footerHeightInPx - this.contextMenuClickLocation.y;
      const upSpace = this.contextMenuClickLocation.y;

      // If not enough space to open up-bottom
      if (maxContextMenuHeight > bottomSpace) {
        // If there's enough space, open bottom-up
        if (upSpace > maxContextMenuHeight) {
          openUpBottom = false;
          this.setContextMenuMaxHeight('auto');
          // Else, reduce max height (menu will be scrollable) and open in whichever direction there's more space
        } else {
          if (upSpace > bottomSpace) {
            this.setContextMenuMaxHeight(upSpace - MENU_MARGIN_FROM_APP_BORDER);
            openUpBottom = false;
          } else {
            this.setContextMenuMaxHeight(
              bottomSpace - MENU_MARGIN_FROM_APP_BORDER
            );
          }
        }
      } else {
        this.setContextMenuMaxHeight('auto');
      }
    }

    if (openUpBottom) {
      this.setContextMenuPosition({
        top: this.contextMenuClickLocation.y,
        left: this.contextMenuClickLocation.x,
      });
    } else {
      this.setContextMenuPosition({
        bottom: clientHeight - this.contextMenuClickLocation.y,
        left: this.contextMenuClickLocation.x,
      });
    }
  }

  public get allLocalRootTags(): SNTag[] {
    if (
      this.editing_ instanceof SNTag &&
      this.application.isTemplateItem(this.editing_)
    ) {
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

    const children = this.application.getTagChildren(tag);

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

    await this.application.sync.sync();
  }

  get rootTags(): SNTag[] {
    return this.tags.filter((tag) => !this.application.getTagParent(tag));
  }

  get tagsCount(): number {
    return this.tags.length;
  }

  setAllNotesCount(allNotesCount: number) {
    this.allNotesCount_ = allNotesCount;
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

  public setExpanded(tag: SNTag, expanded: boolean) {
    this.application.changeAndSaveItem<TagMutator>(tag.uuid, (mutator) => {
      mutator.expanded = expanded;
    });
  }

  public get selectedUuid(): UuidString | undefined {
    return this.selected_?.uuid;
  }

  public get editingTag(): SNTag | SmartView | undefined {
    return this.editing_;
  }

  public set editingTag(editingTag: SNTag | SmartView | undefined) {
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
    const previousTag = this.previouslySelected_ || this.smartViews[0];
    this.selected = previousTag;
  }

  public async remove(tag: SNTag | SmartView, userTriggered: boolean) {
    let shouldDelete = !userTriggered;
    if (userTriggered) {
      shouldDelete = await confirmDialog({
        text: STRING_DELETE_TAG,
        confirmButtonStyle: 'danger',
      });
    }
    if (shouldDelete) {
      this.application.deleteItem(tag);
      this.selected = this.smartViews[0];
    }
  }

  public async save(tag: SNTag | SmartView, newTitle: string) {
    const hasEmptyTitle = newTitle.length === 0;
    const hasNotChangedTitle = newTitle === tag.title;
    const isTemplateChange = this.application.isTemplateItem(tag);

    const siblings =
      tag instanceof SNTag ? tagSiblings(this.application, tag) : [];
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
      const isSmartViewTitle = this.application.isSmartViewTitle(newTitle);

      if (isSmartViewTitle) {
        if (!this.features.hasSmartViews) {
          await this.features.showPremiumAlert(SMART_TAGS_FEATURE_NAME);
          return;
        }
      }

      const insertedTag = await this.application.createTagOrSmartView(newTitle);
      this.application.sync.sync();
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
        item.content_type === ContentType.SmartView
      ) {
        const matchingTag = this.application.findItem(item.uuid);

        if (matchingTag) {
          this.selected = matchingTag as AnyTag;
          return;
        }
      }
    } else if (action === ComponentAction.ClearSelection) {
      this.selected = this.smartViews[0];
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
