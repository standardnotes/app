import { ContentType, SNSmartTag, SNTag } from '@standardnotes/snjs';
import { action, makeObservable, observable } from 'mobx';
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
      addTagToSelectedNotes: action,
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

  async addTagToSelectedNotes(tag: SNTag): Promise<void> {
    const selectedNotes = Object.values(
      this.application.getAppState().notes.selectedNotes
    );
    await Promise.all(
      selectedNotes.map(
        async (note) =>
          await this.application.changeItem(tag.uuid, (mutator) => {
            mutator.addItemAsRelationship(note);
          })
      )
    );
    this.application.sync();
  }
}
