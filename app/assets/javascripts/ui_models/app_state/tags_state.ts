import {
  ContentType,
  SNSmartTag,
  SNTag,
  UuidString,
} from '@standardnotes/snjs';
import {
  action,
  computed,
  makeObservable,
  observable,
  runInAction,
} from 'mobx';
import { WebApplication } from '../application';
import { FeaturesState } from './features_state';

export class TagsState {
  tags: SNTag[] = [];
  smartTags: SNSmartTag[] = [];

  constructor(
    private application: WebApplication,
    appEventListeners: (() => void)[],
    private features: FeaturesState
  ) {
    makeObservable(this, {
      tags: observable,
      smartTags: observable,
      hasFolders: computed,

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
          });
        }
      )
    );
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

  assignParent(tagUuid: string, parentUuid: string | undefined): void {
    const tag = this.application.findItem(tagUuid) as SNTag;

    const parent =
      parentUuid && (this.application.findItem(parentUuid) as SNTag);

    if (!parent) {
      this.application.unsetTagParent(tag);
    } else {
      this.application.setTagParent(parent, tag);
    }
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
}
