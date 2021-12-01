import {
  ContentType,
  FeatureIdentifier,
  FeatureStatus,
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

export class TagsState {
  tags: SNTag[] = [];
  smartTags: SNSmartTag[] = [];
  _hasFolders = true;

  constructor(
    private application: WebApplication,
    appEventListeners: (() => void)[]
  ) {
    this._hasFolders = this.hasFolderFeature();

    makeObservable(this, {
      tags: observable,
      smartTags: observable,
      _hasFolders: observable,
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

    // TODO(laurent): I use streamItems to trigger a re-run after features have loaded.
    // Figure out a better flow for this.
    appEventListeners.push(
      this.application.streamItems([ContentType.Component], () => {
        runInAction(() => {
          this._hasFolders = this.hasFolderFeature();
        });
      })
    );
  }

  public hasFolderFeature(): boolean {
    const status = this.application.getFeatureStatus(
      FeatureIdentifier.TagNesting
    );
    return status === FeatureStatus.Entitled;
  }

  public get hasFolders(): boolean {
    return this._hasFolders;
  }

  public set hasFolders(x: boolean) {
    if (!x) {
      this._hasFolders = false;
      return;
    }

    const status = this.application.getFeatureStatus(
      FeatureIdentifier.TagNesting
    );

    if (status === FeatureStatus.Entitled) {
      this._hasFolders = true;
      return;
    } else if (status === FeatureStatus.InCurrentPlanButExpired) {
      this.application.alertService?.alert('Your plan expired.');
    } else if (status === FeatureStatus.NotInCurrentPlan) {
      this.application.alertService?.alert(
        'Tag Folders requires at least a Plus Subscription.'
      );
    } else if (status === FeatureStatus.NoUserSubscription) {
      this.application.alertService?.alert(
        'Tag Folders requires at least a Plus Subscription.'
      );
    }
  }

  getChildren(tag: SNTag): SNTag[] {
    if (!this.hasFolders) {
      return [];
    }

    try {
      // In the case of template tags, this code throw,
      // We implement a general catch-all for now.
      const children = this.application.getTagChildren(tag);
      const childrenUuids = children.map((x) => x.uuid);
      const childrenTags = this.tags.filter((x) =>
        childrenUuids.includes(x.uuid)
      );
      return childrenTags;
    } catch {
      return [];
    }
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
}
