import { ContentType, SNSmartTag, SNTag } from '@standardnotes/snjs';
import {
  action,
  computed,
  makeObservable,
  observable,
  runInAction,
} from 'mobx';
import { WebApplication } from '../application';

export class TagsState {
  tags: SNTag[] = [];
  smartTags: SNSmartTag[] = [];
  hasFolders = true;

  constructor(
    private application: WebApplication,
    appEventListeners: (() => void)[]
  ) {
    makeObservable(this, {
      tags: observable,
      smartTags: observable,
      hasFolders: observable,

      assignParent: action,

      rootTags: computed,
      tagsCount: computed,
    });

    appEventListeners.push(
      this.application.streamItems(
        [ContentType.Tag, ContentType.SmartTag],
        () => {
          runInAction(() => {
            // TODO: what is getDisplayableItems? Does it means I can't just getChildren for a tag but I have to go through this call?
            // TODO: what about sorting, is the data sorted? (get children is not from what I can see).
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

    const children = this.application.getTagChildren(tag);
    const childrenUuids = children.map((x) => x.uuid);
    const childrenTags = this.tags.filter((x) =>
      childrenUuids.includes(x.uuid)
    );
    return childrenTags;
  }

  isValidTagParent(tagUuid: string, parentUuid: string): boolean {
    const tag = this.application.findItem(tagUuid) as SNTag;
    const parent = this.application.findItem(parentUuid) as SNTag;
    return this.application.isValidTagParent(parent, tag);
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
}
