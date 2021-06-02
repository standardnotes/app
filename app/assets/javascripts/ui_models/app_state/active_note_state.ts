import {
  SNNote,
  ContentType,
  SNTag,
} from '@standardnotes/snjs';
import {
  action,
  computed,
  makeObservable,
  observable,
} from 'mobx';
import { WebApplication } from '../application';
import { AppState } from './app_state';

export class ActiveNoteState {
  inputOverflowed = false;
  overflowCountPosition = 0;
  overflowedTagsCount = 0;
  tagElements: (HTMLButtonElement | undefined)[] = [];
  tagFocused = false;
  tags: SNTag[] = [];
  tagsContainerMaxWidth: number | 'auto' = 0;
  tagsContainerExpanded = false;

  constructor(
    private application: WebApplication,
    private appState: AppState,
    appEventListeners: (() => void)[]
  ) {
    makeObservable(this, {
      inputOverflowed: observable,
      overflowCountPosition: observable,
      overflowedTagsCount: observable,
      tagElements: observable,
      tagFocused: observable,
      tags: observable,
      tagsContainerExpanded: observable,
      tagsContainerMaxWidth: observable,

      tagsOverflowed: computed,

      setInputOverflowed: action,
      setOverflowCountPosition: action,
      setOverflowedTagsCount: action,
      setTagElement: action,
      setTagFocused: action,
      setTags: action,
      setTagsContainerExpanded: action,
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

  get tagsOverflowed(): boolean {
    return this.overflowedTagsCount > 0 && !this.tagsContainerExpanded;
  }

  setInputOverflowed(overflowed: boolean): void {
    this.inputOverflowed = overflowed;
  }

  setOverflowCountPosition(position: number): void {
    this.overflowCountPosition = position;
  }

  setOverflowedTagsCount(count: number): void {
    this.overflowedTagsCount = count;
  }

  setTagElement(tag: SNTag, element: HTMLButtonElement): void {
    const tagIndex = this.getTagIndex(tag);
    if (tagIndex > -1) {
      this.tagElements.splice(tagIndex, 1, element);
    }
  }

  setTagFocused(focused: boolean): void {
    this.tagFocused = focused;
  }

  setTagElements(elements: (HTMLButtonElement | undefined)[]): void {
    this.tagElements = elements;
  }

  setTags(tags: SNTag[]): void {
    this.tags = tags;
  }

  setTagsContainerExpanded(expanded: boolean): void {
    this.tagsContainerExpanded = expanded;
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

  getPreviousTag(tag: SNTag): SNTag | undefined {
    const previousTagIndex = this.getTagIndex(tag) - 1;
    if (previousTagIndex > -1 && this.tags.length > previousTagIndex) {
      return this.tags[previousTagIndex];
    }
  }

  isElementOverflowed(element: HTMLElement): boolean {
    if (
      this.tagElements.length === 0 ||
      !this.tagElements[0]
    ) {
      return false;
    }
    const firstTagTop = this.tagElements[0].offsetTop;
    return element.offsetTop > firstTagTop;
  }

  isTagOverflowed(tag: SNTag): boolean {
    if (this.tagsContainerExpanded) {
      return false;
    }
    const tagElement = this.getTagElement(tag);
    return tagElement ? this.isElementOverflowed(tagElement) : false;
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

  reloadOverflowCountPosition(): void {
    const lastVisibleTagIndex = this.tagElements.findIndex(tagElement => tagElement && this.isElementOverflowed(tagElement)) - 1;
    if (lastVisibleTagIndex > -1 && this.tagElements.length > lastVisibleTagIndex) {
      const lastVisibleTagElement = this.tagElements[lastVisibleTagIndex];
      if (lastVisibleTagElement) {
        const { offsetLeft, offsetWidth } = lastVisibleTagElement;
        this.setOverflowCountPosition(offsetLeft + offsetWidth);
      }
    }
  }

  reloadOverflowedTagsCount(): void {
    const count = this.tagElements.filter((tagElement) =>
      tagElement && this.isElementOverflowed(tagElement)
    ).length;
    this.setOverflowedTagsCount(count);
  }

  reloadTagsContainerMaxWidth(): void {
    const EDITOR_ELEMENT_ID = 'editor-column';
    const defaultFontSize = parseFloat(window.getComputedStyle(
      document.documentElement
    ).fontSize);
    const overflowMargin = defaultFontSize * 5;
    const editorWidth = document.getElementById(EDITOR_ELEMENT_ID)?.clientWidth;
    if (editorWidth) {
      this.appState.activeNote.setTagsContainerMaxWidth(
        editorWidth - overflowMargin
      );
    }
  }

  reloadTagsContainerLayout(): void {
    this.reloadTagsContainerMaxWidth();
    this.reloadOverflowedTagsCount();
    this.reloadOverflowCountPosition();
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
      await this.application.changeItem(tag.uuid, (mutator) => {
        mutator.removeItemAsRelationship(activeNote);
      });
      this.application.sync();
      this.reloadTags();
    }
  }
}
