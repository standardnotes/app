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
  tags: SNTag[] = [];
  tagsContainerMaxWidth: number | 'auto' = 0;
  tagsContainerExpanded = false;
  overflowedTagsCount = 0;
  tagFocused = false;

  constructor(
    private application: WebApplication,
    private appState: AppState,
    appEventListeners: (() => void)[]
  ) {
    makeObservable(this, {
      tags: observable,
      tagsContainerMaxWidth: observable,
      tagsContainerExpanded: observable,
      overflowedTagsCount: observable,
      tagFocused: observable,

      tagsOverflowed: computed,
      
      setTagsContainerMaxWidth: action,
      setTagsContainerExpanded: action,
      setOverflowedTagsCount: action,
      setTagFocused: action,
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

  setTagsContainerMaxWidth(width: number): void {
    this.tagsContainerMaxWidth = width;
  }

  setTagsContainerExpanded(expanded: boolean): void {
    this.tagsContainerExpanded = expanded;
  }

  setOverflowedTagsCount(count: number): void {
    this.overflowedTagsCount = count;
  }

  setTagFocused(focused: boolean): void {
    this.tagFocused = focused;
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
