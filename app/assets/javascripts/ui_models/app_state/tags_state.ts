import { ContentType, SNSmartTag, SNTag, UuidString } from '@standardnotes/snjs';
import {
  action,
  computed,
  makeAutoObservable,
  makeObservable,
  observable,
  runInAction
} from 'mobx';
import { WebApplication } from '../application';
import { FeaturesState } from './features_state';


export class TagsState {
  tags: SNTag[] = [];
  smartTags: SNSmartTag[] = [];
  private readonly tagsCountsState: TagsCountsState;

  constructor(
    private application: WebApplication,
    appEventListeners: (() => void)[],
    private features: FeaturesState
  ) {
    this.tagsCountsState = new TagsCountsState(this.application);

    makeObservable(this, {
      tags: observable.ref,
      smartTags: observable.ref,
      hasFolders: computed,
      hasAtLeastOneFolder: computed,

      assignParent: action,

      rootTags: computed,
      tagsCount: computed,
    });

    appEventListeners.push(
      this.application.streamItems(
        [ContentType.Tag, ContentType.SmartTag],
        () => {
          runInAction(() => {
            this.tags = this.application.getDisplayableItems(
              ContentType.Tag
            ) as SNTag[];
            this.smartTags = this.application.getSmartTags();

            this.tagsCountsState.update(this.tags);
          });
        }
      )
    );
  }

  public getNotesCount(tag: SNTag): number {
    return this.tagsCountsState.counts[tag.uuid] || 0;
  }

  getChildren(tag: SNTag): SNTag[] {
    if (!this.hasFolders) {
      return [];
    }

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
    if (!this.hasFolders) {
      return this.tags;
    }

    return this.tags.filter((tag) => !this.application.getTagParent(tag));
  }

  get tagsCount(): number {
    return this.tags.length;
  }

  public get hasFolders(): boolean {
    return this.features.hasFolders;
  }

  public set hasFolders(hasFolders: boolean) {
    this.features.hasFolders = hasFolders;
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
