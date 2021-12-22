import { ContentType, SNSmartTag, SNTag } from '@standardnotes/snjs';
import {
  action,
  computed,
  makeAutoObservable,
  makeObservable,
  observable,
  runInAction,
} from 'mobx';
import { WebApplication } from '../application';

export class TagsState {
  tags: SNTag[] = [];
  smartTags: SNSmartTag[] = [];
  private readonly tagsCountsState: TagsCountsState;

  constructor(
    private application: WebApplication,
    appEventListeners: (() => void)[]
  ) {
    this.tagsCountsState = new TagsCountsState(this.application);

    makeObservable(this, {
      tags: observable,
      smartTags: observable,

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

  get tagsCount(): number {
    return this.tags.length;
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
