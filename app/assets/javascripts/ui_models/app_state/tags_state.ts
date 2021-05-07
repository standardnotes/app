import { ContentType, SNSmartTag, SNTag } from '@standardnotes/snjs';
import { action, computed, makeObservable, observable } from 'mobx';
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

      addTagToSelectedNotes: action,
      removeTagFromSelectedNotes: action,
      isTagInSelectedNotes: action,
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
    await this.application.changeItem(tag.uuid, (mutator) => {
      for (const note of selectedNotes) {
        mutator.addItemAsRelationship(note);
      }
    });
    this.application.sync();
  }

  async removeTagFromSelectedNotes(tag: SNTag): Promise<void> {
    const selectedNotes = Object.values(
      this.application.getAppState().notes.selectedNotes
    );
    await Promise.all(
      selectedNotes.map(
        async (note) =>
          await this.application.changeItem(tag.uuid, (mutator) => {
            mutator.removeItemAsRelationship(note);
          })
      )
    );
    this.application.sync();
  }

  isTagInSelectedNotes(tag: SNTag): boolean {
    const selectedNotes = Object.values(
      this.application.getAppState().notes.selectedNotes
    );
    return selectedNotes.every((note) =>
      this.application
        .getAppState()
        .getNoteTags(note)
        .find((noteTag) => noteTag.uuid === tag.uuid)
    );
  }

  get tagsCount(): number {
    return this.tags.length;
  }
}
