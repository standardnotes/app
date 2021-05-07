import { ContentType, SNSmartTag, SNTag } from '@standardnotes/snjs';
import { computed, makeObservable, observable } from 'mobx';
import { WebApplication } from '../application';

export class TagsState {
  tags: SNTag[] = [];
  smartTags: SNSmartTag[] = [];

  constructor(
    private application: WebApplication,
    appEventListeners: (() => void)[]
  ) {
    makeObservable(this, {
      tags: observable,
      smartTags: observable,

      tagsCount: computed,
    });

    appEventListeners.push(
      this.application.streamItems(
        [ContentType.Tag, ContentType.SmartTag],
        async () => {
          this.tags = this.application.getDisplayableItems(
            ContentType.Tag
          ) as SNTag[];
          this.smartTags = this.application.getSmartTags();
        }
      )
    );
  }

  get tagsCount(): number {
    return this.tags.length;
  }
}
