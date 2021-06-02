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
  overflowedTagsCount = 0;
  tags: SNTag[] = [];
  tagsContainerMaxWidth: number | 'auto' = 0;
  tagFocused = false;
  tagsContainerExpanded = false;

  constructor(
    private application: WebApplication,
    private appState: AppState,
    appEventListeners: (() => void)[]
  ) {
    makeObservable(this, {
      inputOverflowed: observable,
      overflowedTagsCount: observable,
      tags: observable,
      tagFocused: observable,
      tagsContainerExpanded: observable,
      tagsContainerMaxWidth: observable,

      tagsOverflowed: computed,
      
      setInputOverflowed: action,
      setOverflowedTagsCount: action,
      setTagFocused: action,
      setTagsContainerExpanded: action,
      setTagsContainerMaxWidth: action,
      reloadTags: action,
    });

    appEventListeners.push(
      application.streamItems(
        ContentType.Tag,
        () => {
          this.reloadTags();
        }
      )
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

  setOverflowedTagsCount(count: number): void {
    this.overflowedTagsCount = count;
  }

  setTagFocused(focused: boolean): void {
    this.tagFocused = focused;
  }

  setTagsContainerExpanded(expanded: boolean): void {
    this.tagsContainerExpanded = expanded;
  }

  setTagsContainerMaxWidth(width: number): void {
    this.tagsContainerMaxWidth = width;
  }

  reloadTags(): void {
    const { activeNote } = this;
    if (activeNote) {
      this.tags = this.application.getSortedTagsForNote(activeNote);
    } 
  }

  reloadTagsContainerLayout(): void {
    const EDITOR_ELEMENT_ID = 'editor-column';
    const defaultFontSize = window.getComputedStyle(
      document.documentElement
    ).fontSize;
    const containerMargins = parseFloat(defaultFontSize) * 6;
    const deleteButtonMargin = this.tagFocused ? parseFloat(defaultFontSize) * 1.25 : 0;
    const editorWidth =
      document.getElementById(EDITOR_ELEMENT_ID)?.clientWidth;

    if (editorWidth) {
      this.appState.activeNote.setTagsContainerMaxWidth(
        editorWidth - containerMargins + deleteButtonMargin
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
      await this.application.changeItem(tag.uuid, (mutator) => {
        mutator.removeItemAsRelationship(activeNote);
      });
      this.application.sync();
      this.reloadTags();
    }
  }
}
