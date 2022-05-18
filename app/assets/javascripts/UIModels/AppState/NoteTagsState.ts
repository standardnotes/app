import { ElementIds } from '@/ElementIDs'
import { destroyAllObjectProperties } from '@/Utils'
import { ApplicationEvent, ContentType, DeinitSource, PrefKey, SNNote, SNTag, UuidString } from '@standardnotes/snjs'
import { action, computed, makeObservable, observable } from 'mobx'
import { WebApplication } from '../Application'
import { AbstractState } from './AbstractState'
import { AppState } from './AppState'

export class NoteTagsState extends AbstractState {
  autocompleteInputFocused = false
  autocompleteSearchQuery = ''
  autocompleteTagHintFocused = false
  autocompleteTagResults: SNTag[] = []
  focusedTagResultUuid: UuidString | undefined = undefined
  focusedTagUuid: UuidString | undefined = undefined
  tags: SNTag[] = []
  tagsContainerMaxWidth: number | 'auto' = 0
  addNoteToParentFolders: boolean

  override deinit(source: DeinitSource) {
    super.deinit(source)
    ;(this.tags as unknown) = undefined
    ;(this.autocompleteTagResults as unknown) = undefined

    destroyAllObjectProperties(this)
  }

  constructor(application: WebApplication, override appState: AppState, appEventListeners: (() => void)[]) {
    super(application, appState)

    makeObservable(this, {
      autocompleteInputFocused: observable,
      autocompleteSearchQuery: observable,
      autocompleteTagHintFocused: observable,
      autocompleteTagResults: observable,
      focusedTagUuid: observable,
      focusedTagResultUuid: observable,
      tags: observable,
      tagsContainerMaxWidth: observable,

      autocompleteTagHintVisible: computed,

      setAutocompleteInputFocused: action,
      setAutocompleteSearchQuery: action,
      setAutocompleteTagHintFocused: action,
      setAutocompleteTagResults: action,
      setFocusedTagResultUuid: action,
      setFocusedTagUuid: action,
      setTags: action,
      setTagsContainerMaxWidth: action,
    })

    this.addNoteToParentFolders = application.getPreference(PrefKey.NoteAddToParentFolders, true)

    appEventListeners.push(
      application.streamItems(ContentType.Tag, () => {
        this.reloadTags()
      }),
      application.addSingleEventObserver(ApplicationEvent.PreferencesChanged, async () => {
        this.addNoteToParentFolders = application.getPreference(PrefKey.NoteAddToParentFolders, true)
      }),
    )
  }

  get autocompleteTagHintVisible(): boolean {
    return (
      this.autocompleteSearchQuery !== '' &&
      !this.autocompleteTagResults.some((tagResult) => tagResult.title === this.autocompleteSearchQuery)
    )
  }

  setAutocompleteInputFocused(focused: boolean): void {
    this.autocompleteInputFocused = focused
  }

  setAutocompleteSearchQuery(query: string): void {
    this.autocompleteSearchQuery = query
  }

  setAutocompleteTagHintFocused(focused: boolean): void {
    this.autocompleteTagHintFocused = focused
  }

  setAutocompleteTagResults(results: SNTag[]): void {
    this.autocompleteTagResults = results
  }

  setFocusedTagUuid(tagUuid: UuidString | undefined): void {
    this.focusedTagUuid = tagUuid
  }

  setFocusedTagResultUuid(tagUuid: UuidString | undefined): void {
    this.focusedTagResultUuid = tagUuid
  }

  setTags(tags: SNTag[]): void {
    this.tags = tags
  }

  setTagsContainerMaxWidth(width: number): void {
    this.tagsContainerMaxWidth = width
  }

  clearAutocompleteSearch(): void {
    this.setAutocompleteSearchQuery('')
    this.setAutocompleteTagResults([])
  }

  async createAndAddNewTag(): Promise<void> {
    const newTag = await this.application.mutator.findOrCreateTag(this.autocompleteSearchQuery)
    await this.addTagToActiveNote(newTag)
    this.clearAutocompleteSearch()
  }

  focusNextTag(tag: SNTag): void {
    const nextTagIndex = this.getTagIndex(tag, this.tags) + 1
    if (nextTagIndex > -1 && this.tags.length > nextTagIndex) {
      const nextTag = this.tags[nextTagIndex]
      this.setFocusedTagUuid(nextTag.uuid)
    }
  }

  focusNextTagResult(tagResult: SNTag): void {
    const nextTagResultIndex = this.getTagIndex(tagResult, this.autocompleteTagResults) + 1
    if (nextTagResultIndex > -1 && this.autocompleteTagResults.length > nextTagResultIndex) {
      const nextTagResult = this.autocompleteTagResults[nextTagResultIndex]
      this.setFocusedTagResultUuid(nextTagResult.uuid)
    }
  }

  focusPreviousTag(tag: SNTag): void {
    const previousTagIndex = this.getTagIndex(tag, this.tags) - 1
    if (previousTagIndex > -1 && this.tags.length > previousTagIndex) {
      const previousTag = this.tags[previousTagIndex]
      this.setFocusedTagUuid(previousTag.uuid)
    }
  }

  focusPreviousTagResult(tagResult: SNTag): void {
    const previousTagResultIndex = this.getTagIndex(tagResult, this.autocompleteTagResults) - 1
    if (previousTagResultIndex > -1 && this.autocompleteTagResults.length > previousTagResultIndex) {
      const previousTagResult = this.autocompleteTagResults[previousTagResultIndex]
      this.setFocusedTagResultUuid(previousTagResult.uuid)
    }
  }

  searchActiveNoteAutocompleteTags(): void {
    const newResults = this.application.items.searchTags(
      this.autocompleteSearchQuery,
      this.appState.notesView.activeControllerNote,
    )
    this.setAutocompleteTagResults(newResults)
  }

  getTagIndex(tag: SNTag, tagsArr: SNTag[]): number {
    return tagsArr.findIndex((t) => t.uuid === tag.uuid)
  }

  reloadTags(): void {
    const activeNote = this.appState.notesView.activeControllerNote

    if (activeNote) {
      const tags = this.application.items.getSortedTagsForNote(activeNote)
      this.setTags(tags)
    }
  }

  reloadTagsContainerMaxWidth(): void {
    const editorWidth = document.getElementById(ElementIds.EditorColumn)?.clientWidth
    if (editorWidth) {
      this.setTagsContainerMaxWidth(editorWidth)
    }
  }

  async addTagToActiveNote(tag: SNTag): Promise<void> {
    const activeNote = this.appState.notesView.activeControllerNote

    if (activeNote) {
      await this.application.items.addTagToNote(activeNote, tag, this.addNoteToParentFolders)
      this.application.sync.sync().catch(console.error)
      this.reloadTags()
    }
  }

  async removeTagFromActiveNote(tag: SNTag): Promise<void> {
    const activeNote = this.appState.notesView.activeControllerNote

    if (activeNote) {
      await this.application.mutator.changeItem(tag, (mutator) => {
        mutator.removeItemAsRelationship(activeNote)
      })
      this.application.sync.sync().catch(console.error)
      this.reloadTags()
    }
  }

  getSortedTagsForNote(note: SNNote): SNTag[] {
    const tags = this.application.items.getSortedTagsForNote(note)

    const sortFunction = (tagA: SNTag, tagB: SNTag): number => {
      const a = this.getLongTitle(tagA)
      const b = this.getLongTitle(tagB)

      if (a < b) {
        return -1
      }
      if (b > a) {
        return 1
      }
      return 0
    }

    return tags.sort(sortFunction)
  }

  getPrefixTitle(tag: SNTag): string | undefined {
    return this.application.items.getTagPrefixTitle(tag)
  }

  getLongTitle(tag: SNTag): string {
    return this.application.items.getTagLongTitle(tag)
  }
}
