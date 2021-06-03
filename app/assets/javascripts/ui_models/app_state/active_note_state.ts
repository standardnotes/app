import { SNNote, ContentType, SNTag } from '@standardnotes/snjs';
import { action, computed, makeObservable, observable } from 'mobx';
import { WebApplication } from '../application';
import { AppState } from './app_state';

export class ActiveNoteState {
  autocompleteSearchQuery = '';
  autocompleteTagResultElements: (HTMLButtonElement | undefined)[] = [];
  autocompleteTagResults: SNTag[] = [];
  tagElements: (HTMLButtonElement | undefined)[] = [];
  tags: SNTag[] = [];
  tagsContainerMaxWidth: number | 'auto' = 0;

  constructor(
    private application: WebApplication,
    private appState: AppState,
    appEventListeners: (() => void)[]
  ) {
    makeObservable(this, {
      autocompleteSearchQuery: observable,
      autocompleteTagResultElements: observable,
      autocompleteTagResults: observable,
      tagElements: observable,
      tags: observable,
      tagsContainerMaxWidth: observable,

      autocompleteTagHintVisible: computed,

      clearAutocompleteSearch: action,
      setAutocompleteSearchQuery: action,
      setAutocompleteTagResultElement: action,
      setAutocompleteTagResultElements: action,
      setAutocompleteTagResults: action,
      setTagElement: action,
      setTagElements: action,
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

  get autocompleteTagHintVisible(): boolean {
    return (
      this.autocompleteSearchQuery !== '' &&
      !this.autocompleteTagResults.some(
        (tagResult) => tagResult.title === this.autocompleteSearchQuery
      )
    );
  }

  setAutocompleteSearchQuery(query: string): void {
    this.autocompleteSearchQuery = query;
  }

  setAutocompleteTagResultElement(
    tagResult: SNTag,
    element: HTMLButtonElement
  ): void {
    const tagIndex = this.getTagIndex(tagResult, this.autocompleteTagResults);
    if (tagIndex > -1) {
      this.autocompleteTagResultElements.splice(tagIndex, 1, element);
    }
  }

  setAutocompleteTagResultElements(
    elements: (HTMLButtonElement | undefined)[]
  ): void {
    this.autocompleteTagResultElements = elements;
  }

  setAutocompleteTagResults(results: SNTag[]): void {
    this.autocompleteTagResults = results;
  }

  setTagElement(tag: SNTag, element: HTMLButtonElement): void {
    const tagIndex = this.getTagIndex(tag, this.tags);
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

  clearAutocompleteSearch(): void {
    this.setAutocompleteSearchQuery('');
    this.searchActiveNoteAutocompleteTags();
  }

  async createAndAddNewTag(): Promise<void> {
    const newTag = await this.application.findOrCreateTag(this.autocompleteSearchQuery);
    await this.addTagToActiveNote(newTag);
    this.clearAutocompleteSearch();
  }

  searchActiveNoteAutocompleteTags(): void {
    const newResults = this.application.searchTags(
      this.autocompleteSearchQuery,
      this.activeNote
    );
    this.setAutocompleteTagResults(newResults);
  }

  getTagIndex(tag: SNTag, tagsArr: SNTag[]): number {
    return tagsArr.findIndex((t) => t.uuid === tag.uuid);
  }

  getPreviousTagElement(tag: SNTag): HTMLButtonElement | undefined {
    const previousTagIndex = this.getTagIndex(tag, this.tags) - 1;
    if (previousTagIndex > -1 && this.tagElements.length > previousTagIndex) {
      return this.tagElements[previousTagIndex];
    }
  }

  getNextTagElement(tag: SNTag): HTMLButtonElement | undefined {
    const nextTagIndex = this.getTagIndex(tag, this.tags) + 1;
    if (nextTagIndex > -1 && this.tagElements.length > nextTagIndex) {
      return this.tagElements[nextTagIndex];
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
    const editorWidth = document.getElementById(EDITOR_ELEMENT_ID)?.clientWidth;
    if (editorWidth) {
      this.setTagsContainerMaxWidth(editorWidth);
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
