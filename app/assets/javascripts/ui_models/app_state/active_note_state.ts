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
  tagsContainerPosition? = 0;
  tagsContainerMaxWidth: number | 'auto' = 'auto';
  tagsContainerCollapsed = true;
  overflowedTagsCount = 0;

  constructor(
    private application: WebApplication,
    private appState: AppState,
    appEventListeners: (() => void)[]
  ) {
    makeObservable(this, {
      tags: observable,
      tagsContainerPosition: observable,
      tagsContainerMaxWidth: observable,
      tagsContainerCollapsed: observable,
      overflowedTagsCount: observable,

      tagsOverflowed: computed,
      
      setTagsContainerPosition: action,
      setTagsContainerMaxWidth: action,
      setTagsContainerCollapsed: action,
      setOverflowedTagsCount: action,
      reloadTags: action,
    });

    this.tagsContainerPosition = document
      .getElementById('editor-column')
      ?.getBoundingClientRect().left;

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
    return this.overflowedTagsCount > 0 && this.tagsContainerCollapsed;
  }

  setTagsContainerPosition(position: number): void {
    this.tagsContainerPosition = position;
  }

  setTagsContainerMaxWidth(width: number): void {
    this.tagsContainerMaxWidth = width;
  }

  setTagsContainerCollapsed(collapsed: boolean): void {
    this.tagsContainerCollapsed = collapsed;
  }

  setOverflowedTagsCount(count: number): void {
    this.overflowedTagsCount = count;
  }

  reloadTags(): void {
    const { activeNote } = this;
    if (activeNote) {
      this.tags = this.application.getSortedTagsForNote(activeNote);
    } 
  }

  reloadTagsContainerLayout(): void {
    const MARGIN = this.tagsContainerCollapsed ? 68 : 24;
    const EDITOR_ELEMENT_ID = 'editor-column';
    const { clientWidth } = document.documentElement;
    const editorPosition =
      document.getElementById(EDITOR_ELEMENT_ID)?.getBoundingClientRect()
        .left ?? 0;
    this.appState.activeNote.setTagsContainerPosition(editorPosition);
    this.appState.activeNote.setTagsContainerMaxWidth(
      clientWidth - editorPosition - MARGIN
    );
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
