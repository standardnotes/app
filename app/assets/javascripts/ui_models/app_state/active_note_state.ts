import {
  SNNote,
  ContentType,
  SNTag,
} from '@standardnotes/snjs';
import {
  action,
  makeObservable,
  observable,
} from 'mobx';
import { WebApplication } from '../application';
import { AppState } from './app_state';

export class ActiveNoteState {
  tagElements: (HTMLButtonElement | undefined)[] = [];
  tags: SNTag[] = [];
  tagsContainerMaxWidth: number | 'auto' = 0;

  constructor(
    private application: WebApplication,
    private appState: AppState,
    appEventListeners: (() => void)[]
  ) {
    makeObservable(this, {
      tagElements: observable,
      tags: observable,
      tagsContainerMaxWidth: observable,

      setTagElement: action,
      setTags: action,
      setTagsContainerMaxWidth: action,
      reloadTags: action,
    });

    appEventListeners.push(
      application.streamItems(ContentType.Tag, () => {
        this.reloadTags();
      })
    );
  }

  get activeNote(): SNNote | undefined {
    return this.appState.notes.activeEditor?.note;
  }

  setTagElement(tag: SNTag, element: HTMLButtonElement): void {
    const tagIndex = this.getTagIndex(tag);
    if (tagIndex > -1) {
      this.tagElements.splice(tagIndex, 1, element);
    }
  }

  setTagElements(elements: (HTMLButtonElement | undefined)[]): void {
    this.tagElements = elements;
  }

  setTags(tags: SNTag[]): void {
    this.tags = tags;
  }

  setTagsContainerMaxWidth(width: number): void {
    this.tagsContainerMaxWidth = width;
  }

  getTagElement(tag: SNTag): HTMLButtonElement | undefined {
    const tagIndex = this.getTagIndex(tag);
    if (tagIndex > -1 && this.tagElements.length > tagIndex) {
      return this.tagElements[tagIndex];
    }
  }

  getTagIndex(tag: SNTag): number {
    return this.tags.findIndex(t => t.uuid === tag.uuid);
  }

  getPreviousTagElement(tag: SNTag): HTMLButtonElement | undefined {
    const previousTagIndex = this.getTagIndex(tag) - 1;
    if (previousTagIndex > -1 && this.tags.length > previousTagIndex) {
      const previousTag = this.tags[previousTagIndex];
      if (previousTag) {
        return this.getTagElement(previousTag);
      }
    }
  }

  getNextTagElement(tag: SNTag): HTMLButtonElement | undefined {
    const nextTagIndex = this.getTagIndex(tag) + 1;
    if (nextTagIndex > -1 && this.tags.length > nextTagIndex) {
      const previousTag = this.tags[nextTagIndex];
      if (previousTag) {
        return this.getTagElement(previousTag);
      }
    }
  }

  reloadTags(): void {
    const { activeNote } = this;
    if (activeNote) {
      const tags = this.application.getSortedTagsForNote(activeNote);
      const tagElements: (HTMLButtonElement | undefined)[] = [];
      this.setTags(tags);
      this.setTagElements(tagElements.fill(undefined, tags.length));
    }
  }

  reloadTagsContainerMaxWidth(): void {
    const EDITOR_ELEMENT_ID = 'editor-column';
    const defaultFontSize = parseFloat(window.getComputedStyle(
      document.documentElement
    ).fontSize);
    const margins = defaultFontSize * 1.5;
    const editorWidth = document.getElementById(EDITOR_ELEMENT_ID)?.clientWidth;
    if (editorWidth) {
      this.appState.activeNote.setTagsContainerMaxWidth(
        editorWidth - margins
      );
    }
  }

  async addTagToActiveNote(tag: SNTag): Promise<void> {
    const { activeNote } = this;
    if (activeNote) {
      await this.application.changeItem(tag.uuid, (mutator) => {
        mutator.addItemAsRelationship(activeNote);
      });
      this.application.sync();
      this.reloadTags();
    }
  }

  async removeTagFromActiveNote(tag: SNTag): Promise<void> {
    const { activeNote } = this;
    if (activeNote) {
      const previousTagElement = this.getPreviousTagElement(tag);
      await this.application.changeItem(tag.uuid, (mutator) => {
        mutator.removeItemAsRelationship(activeNote);
      });
      this.application.sync();
      previousTagElement?.focus();
      this.reloadTags();
    }
  }
}
